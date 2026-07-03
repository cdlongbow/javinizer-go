<script lang="ts">
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n/setup';
	import Button from '$lib/components/ui/Button.svelte';
	import { ChevronDown, ChevronUp, Image, LayoutGrid, List, LoaderCircle, Play, RefreshCw, Settings2, X, CheckSquare, Square, Trash2, RotateCcw, MousePointerClick, Save } from 'lucide-svelte';
	import type { CompletenessTier } from '$lib/utils/completeness';

	interface Props {
		isUpdateMode: boolean;
		canOrganize: boolean;
		organizing: boolean;
		movieResultsLength: number;
		destinationPath: string;
		viewMode?: 'detail' | 'grid-poster' | 'grid-cover';
		forceOverwrite?: boolean;
		preserveNfo?: boolean;
		skipNfo?: boolean;
		skipDownload?: boolean;
		selectedCount?: number;
		allSelected?: boolean;
		bulkExcluding?: boolean;
		bulkRescraping?: boolean;
		completenessFilter?: Set<CompletenessTier>;
		tierCounts?: Record<string, number>;
		selectionMode?: boolean;
		onToggleCompletenessTier?: (tier: CompletenessTier) => void;
		onToggleSelectionMode?: () => void;
		onSelectAll?: () => void;
		onDeselectAll?: () => void;
		onBulkExclude?: () => void;
		onBulkRescrape?: () => void;
		onClose: () => void;
		onUpdateAll: () => void;
		onOrganizeAll: () => void;
		onSaveAll: () => void | Promise<void>;
		hasEdits: boolean;
		editCount: number;
		savingEdits: boolean;
	}

		let {
		isUpdateMode,
		canOrganize,
		organizing,
		movieResultsLength,
		destinationPath,
		viewMode = $bindable<'detail' | 'grid-poster' | 'grid-cover'>('detail'),
		forceOverwrite = $bindable(false),
		preserveNfo = $bindable(false),
		skipNfo = $bindable(false),
		skipDownload = $bindable(false),
		selectedCount = 0,
		allSelected = false,
		bulkExcluding = false,
		bulkRescraping = false,
		completenessFilter = new Set<CompletenessTier>(['incomplete', 'partial', 'complete']),
		tierCounts = { incomplete: 0, partial: 0, complete: 0 },
		selectionMode = false,
		onToggleCompletenessTier,
		onToggleSelectionMode,
		onSelectAll,
		onDeselectAll,
		onBulkExclude,
		onBulkRescrape,
		onClose,
		onUpdateAll,
		onOrganizeAll,
		onSaveAll,
		hasEdits,
		editCount,
		savingEdits
	}: Props = $props();

	$effect(() => {
		if (forceOverwrite) preserveNfo = false;
	});

	$effect(() => {
		if (preserveNfo) forceOverwrite = false;
	});

	let showOptions = $state(false);

	const tierConfig: { tier: CompletenessTier; label: string; dotClass: string }[] = [
		{ tier: 'incomplete', label: 'Incomplete', dotClass: 'bg-red-500' },
		{ tier: 'partial', label: 'Partial', dotClass: 'bg-yellow-500' },
		{ tier: 'complete', label: 'Complete', dotClass: 'bg-green-500' },
	];

	function tierLabel(tier: string): string {
		switch (tier) {
			case 'incomplete': return $t('review.header.incomplete');
			case 'partial': return $t('review.header.partial');
			case 'complete': return $t('review.header.complete');
			default: return tier;
		}
	}
</script>

<div class="flex items-center justify-between mb-6">
	<div>
		<h1 class="text-3xl font-bold">{$t('review.header.title')}</h1>
		<p class="text-muted-foreground mt-1">
			{#if isUpdateMode}
				{$t('review.header.updateDescription')}
			{:else}
				{$t('review.header.organizeDescription')}
			{/if}
		</p>
	</div>
	<div class="flex items-center gap-3">
		<div class="inline-flex rounded-md border border-input p-1">
			<Button
				size="sm"
				variant={viewMode === 'detail' ? 'default' : 'ghost'}
				class="w-24 justify-center"
				onclick={() => { viewMode = 'detail'; }}
			>
				{#snippet children()}
					<List class="h-4 w-4 mr-1" />
					{$t('review.header.view.detail')}
				{/snippet}
			</Button>
			<Button
				size="sm"
				variant={viewMode === 'grid-poster' ? 'default' : 'ghost'}
				class="w-24 justify-center"
				onclick={() => { viewMode = 'grid-poster'; }}
			>
				{#snippet children()}
					<LayoutGrid class="h-4 w-4 mr-1" />
					{$t('review.header.view.poster')}
				{/snippet}
			</Button>
			<Button
				size="sm"
				variant={viewMode === 'grid-cover' ? 'default' : 'ghost'}
				class="w-24 justify-center"
				onclick={() => { viewMode = 'grid-cover'; }}
			>
				{#snippet children()}
					<Image class="h-4 w-4 mr-1" />
					{$t('review.header.view.cover')}
				{/snippet}
			</Button>
		</div>
		<div class="h-8 w-px bg-border"></div>
		{#if hasEdits}
			<Button onclick={() => { void Promise.resolve(onSaveAll()).catch(() => {}); }} disabled={savingEdits || organizing} title={$t('review.header.saveChanges')}>
				{#snippet children()}
					{#if savingEdits}
						<LoaderCircle class="h-4 w-4 mr-2 animate-spin" />
					{:else}
						<Save class="h-4 w-4 mr-2" />
					{/if}
					{savingEdits ? $t('review.header.saving') : editCount > 1 ? `{$t('review.header.saveChanges')} (${editCount})` : $t('review.header.saveChanges')}
				{/snippet}
			</Button>
		{/if}
		<Button variant="outline" onclick={onClose} disabled={organizing}>
			{#snippet children()}
				<X class="h-4 w-4 mr-2" />
				{isUpdateMode ? $t('review.header.close') : $t('review.header.cancel')}
			{/snippet}
		</Button>
		{#if isUpdateMode}
			<Button onclick={onUpdateAll} disabled={organizing}>
				{#snippet children()}
					{#if organizing}
						<LoaderCircle class="h-4 w-4 mr-2 animate-spin" />
					{:else}
						<RefreshCw class="h-4 w-4 mr-2" />
					{/if}
					{organizing ? $t('review.header.updating') : $t('review.header.updateFiles', { values: { count: movieResultsLength } })}
				{/snippet}
			</Button>
		{:else}
			<Button onclick={onOrganizeAll} disabled={organizing || !canOrganize || !destinationPath.trim()}>
				{#snippet children()}
					{#if organizing}
						<LoaderCircle class="h-4 w-4 mr-2 animate-spin" />
					{:else}
						<Play class="h-4 w-4 mr-2" />
					{/if}
					{organizing ? $t('review.header.organizing') : $t('review.header.organizeFiles', { values: { count: movieResultsLength } })}
				{/snippet}
			</Button>
		{/if}
	</div>
</div>

{#if viewMode === 'grid-poster' || viewMode === 'grid-cover'}
	<div class="flex items-center gap-3 mb-4">
		<Button
			size="sm"
			variant={selectionMode ? 'default' : 'outline'}
			aria-pressed={selectionMode}
			onclick={() => onToggleSelectionMode?.()}
		>
			{#snippet children()}
				<MousePointerClick class="h-4 w-4 mr-1" />
				{$t('review.header.select')}
			{/snippet}
		</Button>
		{#if selectionMode}
			<Button
				size="sm"
				variant="outline"
				onclick={allSelected ? onDeselectAll : onSelectAll}
			>
				{#snippet children()}
					{#if allSelected}
						<CheckSquare class="h-4 w-4 mr-1" />
						{$t('review.header.deselectAll')}
					{:else}
						<Square class="h-4 w-4 mr-1" />
						{$t('review.header.selectAll')}
					{/if}
				{/snippet}
			</Button>
		{/if}
		<div class="h-4 w-px bg-border"></div>
		<div class="inline-flex items-center gap-1">
			{#each tierConfig as { tier, label, dotClass }}
				{@const count = tierCounts[tier] ?? 0}
				{@const isActive = completenessFilter.has(tier)}
				<button
					class="inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-md border transition-colors
						{isActive ? 'bg-secondary text-secondary-foreground border-border' : 'bg-transparent text-muted-foreground border-transparent hover:bg-accent hover:text-accent-foreground'}
						{count === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
					onclick={() => onToggleCompletenessTier?.(tier)}
					disabled={count === 0}
				>
					<span class="w-2 h-2 rounded-full {isActive ? dotClass : 'bg-muted-foreground/30'}"></span>
					{tierLabel(tier)} ({count})
				</button>
			{/each}
		</div>
		{#if selectedCount > 0}
			<div class="ml-auto flex items-center gap-3">
				<span class="text-sm font-medium text-muted-foreground whitespace-nowrap">
					{selectedCount} {$t('review.header.selectedCount')}
				</span>
				<Button
					size="sm"
					variant="outline"
					onclick={onBulkExclude}
					disabled={bulkExcluding || bulkRescraping}
					class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
				>
					{#snippet children()}
						{#if bulkExcluding}
							<LoaderCircle class="h-4 w-4 mr-1 animate-spin" />
						{:else}
							<Trash2 class="h-4 w-4 mr-1" />
						{/if}
						{$t('review.header.remove')}
					{/snippet}
				</Button>
				<Button
					size="sm"
					variant="outline"
					onclick={onBulkRescrape}
					disabled={bulkExcluding || bulkRescraping}
				>
					{#snippet children()}
						{#if bulkRescraping}
							<LoaderCircle class="h-4 w-4 mr-1 animate-spin" />
						{:else}
							<RotateCcw class="h-4 w-4 mr-1" />
						{/if}
{$t('review.header.rescrape')}
					{/snippet}
				</Button>
			</div>
		{/if}
	</div>
{/if}

{#if isUpdateMode}
	<div class="mb-4">
		<button
			onclick={() => (showOptions = !showOptions)}
			class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
		>
			<Settings2 class="h-4 w-4" />
			{$t('review.header.options')}
			{#if showOptions}
				<ChevronUp class="h-3 w-3" />
			{:else}
				<ChevronDown class="h-3 w-3" />
			{/if}
		</button>

		{#if showOptions}
			<div class="grid gap-3 md:grid-cols-4 mt-3">
				<label
					class="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/50 cursor-pointer transition-colors"
				>
					<input
						type="checkbox"
						bind:checked={forceOverwrite}
						class="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary"
					/>
					<div class="flex-1">
						<span class="text-sm font-medium">{$t('review.header.forceOverwrite')}</span>
						<p class="text-xs text-muted-foreground">{$t('review.header.forceOverwriteDesc')}</p>
					</div>
				</label>

				<label
					class="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/50 cursor-pointer transition-colors"
				>
					<input
						type="checkbox"
						bind:checked={preserveNfo}
						class="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary"
					/>
					<div class="flex-1">
						<span class="text-sm font-medium">{$t('review.header.preserveNfo')}</span>
						<p class="text-xs text-muted-foreground">{$t('review.header.preserveNfoDesc')}</p>
					</div>
				</label>

				<label
					class="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/50 cursor-pointer transition-colors"
				>
					<input
						type="checkbox"
						bind:checked={skipNfo}
						class="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary"
					/>
					<div class="flex-1">
						<span class="text-sm font-medium">{$t('review.header.skipNfo')}</span>
						<p class="text-xs text-muted-foreground">{$t('review.header.skipNfoDesc')}</p>
					</div>
				</label>

				<label
					class="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/50 cursor-pointer transition-colors"
				>
					<input
						type="checkbox"
						bind:checked={skipDownload}
						class="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary"
					/>
					<div class="flex-1">
						<span class="text-sm font-medium">{$t('review.header.skipDownload')}</span>
						<p class="text-xs text-muted-foreground">{$t('review.header.skipDownloadDesc')}</p>
					</div>
				</label>
			</div>
		{/if}
	</div>
{/if}
