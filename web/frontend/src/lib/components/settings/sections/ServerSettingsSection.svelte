<script lang="ts">
	import { onMount } from 'svelte';
	import { RefreshCw, ArrowUpCircle } from 'lucide-svelte';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import { apiClient } from '$lib/api/client';
	import { toastStore } from '$lib/stores/toast';
	import type { VersionStatusResponse, SettingsConfig } from '$lib/api/types';
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n/setup';

	interface Props {
		config: SettingsConfig;
		inputClass: string;
	}

	let { config, inputClass }: Props = $props();

	let versionStatus = $state<VersionStatusResponse | null>(null);
	let isCheckingVersion = $state(false);

	async function loadVersionStatus() {
		try {
			versionStatus = await apiClient.getVersionStatus();
		} catch {
			versionStatus = null;
		}
	}

	async function checkVersion() {
		isCheckingVersion = true;
		try {
			versionStatus = await apiClient.checkVersion();
			if (versionStatus.error) {
				toastStore.error(get(t)('settings.server.versionCheckFailed', { values: { error: versionStatus.error } }));
			} else if (versionStatus.update_available) {
				toastStore.info(get(t)('settings.server.updateAvailable', { values: { version: `v${versionStatus.latest}` } }));
			} else {
				toastStore.success(get(t)('settings.server.upToDate'));
			}
		} catch (e) {
			toastStore.error(get(t)('settings.server.versionCheckFailed', { values: { error: e instanceof Error ? e.message : 'Unknown error' } }));
		} finally {
			isCheckingVersion = false;
		}
	}

	function sanitizeTempDir(value: string): string {
		value = value.trim();
		value = value.replace(/\.\.[\\/]/g, '');
		value = value.replace(/^[\\/]+|[\\/]+$/g, '');
		return value;
	}

	function handleTempDirInput(e: Event) {
		const target = e.target as HTMLInputElement;
		config.system.temp_dir = sanitizeTempDir(target.value);
	}

	onMount(() => {
		loadVersionStatus();
	});
</script>

<SettingsSection title={$t('settings.server.title')} description={$t('settings.server.description')} defaultExpanded={false}>
	<div class="space-y-4">
		<div class="p-3 bg-muted/30 rounded-lg border border-border">
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center gap-2">
					<span class="text-sm font-medium">{$t('settings.server.version')}</span>
					{#if versionStatus}
						<span class="text-sm text-muted-foreground">{versionStatus.current}</span>
						{#if versionStatus.update_available}
							<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
								<ArrowUpCircle class="h-3 w-3" />
								{$t('settings.server.updateAvailable', { values: { version: versionStatus.latest } })}
							</span>
						{/if}
					{:else}
						<span class="text-sm text-muted-foreground">—</span>
					{/if}
				</div>
				<button
					type="button"
					onclick={checkVersion}
					disabled={isCheckingVersion}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input bg-background text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
				>
					<RefreshCw class="h-3.5 w-3.5 {isCheckingVersion ? 'animate-spin' : ''}" />
					{isCheckingVersion ? $t('settings.server.checking') : $t('settings.server.checkForUpdates')}
				</button>
			</div>
			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<input
						id="version-check-enabled"
						type="checkbox"
						bind:checked={config.system.version_check_enabled}
						class="w-4 h-4"
					/>
					<label class="text-sm font-medium" for="version-check-enabled">{$t('settings.server.enableAutoVersionCheck')}</label>
				</div>
				{#if config.system.version_check_enabled}
					<div>
						<label class="block text-sm font-medium mb-2" for="version-check-interval">{$t('settings.server.checkInterval')}</label>
						<input
							id="version-check-interval"
							type="number"
							bind:value={config.system.version_check_interval_hours}
							class={inputClass}
							min="1"
							placeholder="24"
						/>
					</div>
				{/if}
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium mb-2" for="server-host">{$t('settings.server.host')}</label>
				<input id="server-host" type="text" bind:value={config.server.host} class={inputClass} placeholder="localhost" />
			</div>
			<div>
				<label class="block text-sm font-medium mb-2" for="server-port">{$t('settings.server.port')}</label>
				<input id="server-port" type="number" bind:value={config.server.port} class={inputClass} placeholder="8080" />
			</div>
		</div>
		<div>
			<label class="block text-sm font-medium mb-2" for="system-temp-dir">{$t('settings.server.tempDir')}</label>
			<input
				id="system-temp-dir"
				type="text"
				value={config.system.temp_dir}
				oninput={handleTempDirInput}
				class={inputClass}
				placeholder="data/temp"
			/>
			<p class="text-xs text-muted-foreground mt-1">{$t('settings.server.tempDirHint')}</p>
		</div>
	</div>
</SettingsSection>