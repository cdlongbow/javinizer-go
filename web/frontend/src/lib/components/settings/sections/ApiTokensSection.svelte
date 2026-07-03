<script lang="ts">
	import { createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { createApiTokensQuery } from '$lib/query/queries';
	import { createToken, revokeToken, regenerateToken } from '$lib/api/tokens';
	import type { CreateTokenResponse } from '$lib/types/token';
	import { toastStore } from '$lib/stores/toast';
	import { confirmDialog } from '$lib/stores/dialog.svelte';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Plus, Loader2, Trash2, RefreshCw } from 'lucide-svelte';
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n/setup';

	interface Props {
		onTokenDisplay?: (response: CreateTokenResponse) => void;
	}

	let { onTokenDisplay }: Props = $props();

	const queryClient = useQueryClient();

	const tokensQuery = createApiTokensQuery();
	let tokens = $derived(tokensQuery.data?.tokens ?? []);
	let loading = $derived(tokensQuery.isPending);
	let error = $derived<string | null>(tokensQuery.error?.message ?? null);

	let newTokenName = $state('');

	const createTokenMutation = createMutation(() => ({
		mutationFn: (name?: string) => createToken(name),
		onSuccess: (data: CreateTokenResponse) => {
			newTokenName = '';
			toastStore.success(get(t)('settings.apiTokens.created'), 3000);
			onTokenDisplay?.(data);
			void queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
		},
		onError: (err: Error) => {
			toastStore.error(err.message || get(t)('settings.apiTokens.createFailed'), 4000);
		}
	}));

	const revokeTokenMutation = createMutation(() => ({
		mutationFn: (id: string) => revokeToken(id),
		onSuccess: () => {
			toastStore.success(get(t)('settings.apiTokens.revoked'), 3000);
			void queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
		},
		onError: (err: Error) => {
			toastStore.error(err.message || get(t)('settings.apiTokens.revokeFailed'), 4000);
		}
	}));

	const regenerateTokenMutation = createMutation(() => ({
		mutationFn: (id: string) => regenerateToken(id),
		onSuccess: (data: CreateTokenResponse) => {
			toastStore.success(get(t)('settings.apiTokens.regenerated'), 3000);
			onTokenDisplay?.(data);
			void queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
		},
		onError: (err: Error) => {
			toastStore.error(err.message || get(t)('settings.apiTokens.regenerateFailed'), 4000);
		}
	}));

	async function handleCreate() {
		createTokenMutation.mutate(newTokenName.trim() || undefined);
	}

	async function handleRevoke(id: string, name: string) {
		const confirmed = await confirmDialog(
			get(t)('settings.apiTokens.revokeConfirmTitle'),
			get(t)('settings.apiTokens.revokeConfirmMsg', { values: { name: name || id } }),
			{ confirmLabel: get(t)('settings.apiTokens.revokeConfirmLabel'), variant: 'danger' }
		);
		if (confirmed) {
			revokeTokenMutation.mutate(id);
		}
	}

	async function handleRegenerate(id: string, name: string) {
		const confirmed = await confirmDialog(
			get(t)('settings.apiTokens.regenerateConfirmTitle'),
			get(t)('settings.apiTokens.regenerateConfirmMsg', { values: { name: name || id } }),
			{ confirmLabel: get(t)('settings.apiTokens.regenerateConfirmLabel'), variant: 'danger' }
		);
		if (confirmed) {
			regenerateTokenMutation.mutate(id);
		}
	}

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return get(t)('settings.apiTokens.never');
		try {
			return new Date(dateStr).toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return dateStr;
		}
	}

	function handleCreateKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleCreate();
		}
	}
</script>

<SettingsSection title={$t('settings.apiTokens.title')} description={$t('settings.apiTokens.description')} defaultExpanded={false}>
	{#if loading}
		<div class="flex items-center justify-center py-8 text-muted-foreground">
			<Loader2 class="h-5 w-5 animate-spin mr-2" />
			{$t('settings.apiTokens.loading')}
		</div>
	{:else if error}
		<div class="text-destructive text-sm py-4">
			{$t('settings.apiTokens.errorLoading', { values: { error } })}
		</div>
	{:else}
		<div class="space-y-4">
			{#if tokens.length === 0}
				<p class="text-sm text-muted-foreground py-4">
					{$t('settings.apiTokens.noTokens')}
				</p>
			{:else}
				<div class="relative border border-border rounded-lg overflow-hidden">
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-border bg-muted/50">
									<th class="text-left py-2 px-3 font-medium text-muted-foreground">{$t('settings.apiTokens.headerName')}</th>
									<th class="text-left py-2 px-3 font-medium text-muted-foreground">{$t('settings.apiTokens.headerPrefix')}</th>
									<th class="text-left py-2 px-3 font-medium text-muted-foreground">{$t('settings.apiTokens.headerCreated')}</th>
									<th class="text-left py-2 px-3 font-medium text-muted-foreground">{$t('settings.apiTokens.headerLastUsed')}</th>
									<th class="text-right py-2 px-3 font-medium text-muted-foreground">{$t('settings.apiTokens.headerActions')}</th>
								</tr>
							</thead>
							<tbody>
								{#each tokens as token (token.id)}
									<tr class="border-b border-border/50 hover:bg-accent/30 transition-colors">
										<td class="py-2 px-3">{#if token.name}{token.name}{:else}<span class="text-muted-foreground italic">{$t('settings.apiTokens.unnamed')}</span>{/if}</td>
										<td class="py-2 px-3 font-mono text-xs">{token.token_prefix}</td>
										<td class="py-2 px-3 text-xs">{formatDate(token.created_at)}</td>
										<td class="py-2 px-3 text-xs">{formatDate(token.last_used_at)}</td>
										<td class="py-2 px-3 text-right">
											<div class="flex items-center justify-end gap-1">
												<button
													type="button"
													class="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
													title={$t('settings.apiTokens.regenerateTitle')}
													onclick={() => handleRegenerate(token.id, token.name)}
													disabled={regenerateTokenMutation.isPending}
												>
													<RefreshCw class="h-4 w-4" />
												</button>
												<button
													type="button"
													class="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
													title={$t('settings.apiTokens.revokeTitle')}
													onclick={() => handleRevoke(token.id, token.name)}
													disabled={revokeTokenMutation.isPending}
												>
													<Trash2 class="h-4 w-4" />
												</button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
				<p class="text-xs text-muted-foreground">
					{$t('settings.apiTokens.tokensActive', { values: { count: tokens.length } })}
				</p>
			{/if}

			<div class="border-t pt-4">
				<p class="text-xs text-muted-foreground mb-3">{$t('settings.apiTokens.createNew')}</p>
				<div class="flex items-end gap-2">
					<div class="flex-1">
						<label for="token-name" class="block text-xs font-medium text-muted-foreground mb-1">{$t('settings.apiTokens.nameOptional')}</label>
						<input
							id="token-name"
							type="text"
							bind:value={newTokenName}
							placeholder={$t('settings.apiTokens.namePlaceholder')}
							onkeydown={handleCreateKeydown}
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>
					<Button
						size="sm"
						onclick={handleCreate}
						disabled={createTokenMutation.isPending}
					>
						{#if createTokenMutation.isPending}
							<Loader2 class="h-4 w-4 animate-spin mr-1" />
						{:else}
							<Plus class="h-4 w-4 mr-1" />
						{/if}
						{$t('settings.apiTokens.createToken')}
					</Button>
				</div>
			</div>

			<p class="text-xs text-muted-foreground">
				{$t('settings.apiTokens.tokenPrefixHint')}
			</p>
		</div>
	{/if}
</SettingsSection>