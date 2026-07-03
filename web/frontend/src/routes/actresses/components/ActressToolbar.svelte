<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Search, ArrowUpDown, GitMerge } from 'lucide-svelte';
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n/setup';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let {
		queryInput = $bindable(),
		activeQuery,
		viewMode = $bindable(),
		sortBy = $bindable(),
		sortOrder,
		selectedIds,
		total,
		actressesCount,
		isRefreshing,
		onApplySearch,
		onClearSearch,
		onToggleSortOrder,
		onSelectCurrentPage,
		onClearSelection,
		onStartMergeSelected
	}: {
		queryInput: string;
		activeQuery: string;
		viewMode: 'cards' | 'compact' | 'table';
		sortBy: string;
		sortOrder: 'asc' | 'desc';
		selectedIds: number[];
		total: number;
		actressesCount: number;
		isRefreshing: boolean;
		onApplySearch: () => void;
		onClearSearch: () => void;
		onToggleSortOrder: () => void;
		onSelectCurrentPage: () => void;
		onClearSelection: () => void;
		onStartMergeSelected: () => void;
	} = $props();
</script>

<div in:fly|local={{ x: 14, duration: 260, easing: cubicOut }}>
	<Card class="p-4">
		<div class="flex flex-wrap items-center gap-2">
			<div class="flex-1 min-w-55">
				<label class="sr-only" for="search">{$t('actresses.toolbar.searchPlaceholder')}</label>
				<div class="relative">
					<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						id="search"
						type="text"
						bind:value={queryInput}
						onkeydown={(event) => {
							if (event.key === 'Enter') onApplySearch();
						}}
						placeholder="{$t('actresses.toolbar.searchPlaceholder')}"
						class="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm"
					/>
				</div>
			</div>
			<Button onclick={onApplySearch}>{$t('actresses.toolbar.searchBtn')}</Button>
			<Button variant="outline" onclick={onClearSearch}>{$t('actresses.toolbar.clearBtn')}</Button>
		</div>
		<div class="mt-3 flex flex-wrap items-center justify-between gap-3">
			<div class="inline-flex rounded-md border border-input p-1">
				<Button
					size="sm"
					variant={viewMode === 'cards' ? 'default' : 'ghost'}
					onclick={() => {
						viewMode = 'cards';
					}}
				>
					Cards
				</Button>
				<Button
					size="sm"
					variant={viewMode === 'compact' ? 'default' : 'ghost'}
					onclick={() => {
						viewMode = 'compact';
					}}
				>
					{$t('actresses.toolbar.compactView')}
				</Button>
				<Button
					size="sm"
					variant={viewMode === 'table' ? 'default' : 'ghost'}
					onclick={() => {
						viewMode = 'table';
					}}
				>
					{$t('actresses.toolbar.tableView')}
				</Button>
			</div>
			<div class="flex items-center gap-2">
				<select
					bind:value={sortBy}
					class="rounded-md border border-input bg-background px-3 py-2 text-sm"
					aria-label="{$t('actresses.toolbar.sortName').replace('Sort: ', '')}"
				>
					<option value="name">{$t('actresses.toolbar.sortName')}</option>
					<option value="japanese_name">{$t('actresses.toolbar.sortJapaneseName')}</option>
					<option value="id">{$t('actresses.toolbar.sortDatabaseId')}</option>
					<option value="dmm_id">{$t('actresses.toolbar.sortDmmId')}</option>
					<option value="updated_at">{$t('actresses.toolbar.sortUpdatedAt')}</option>
					<option value="created_at">{$t('actresses.toolbar.sortCreatedAt')}</option>
				</select>
				<Button variant="outline" size="sm" onclick={onToggleSortOrder} title="{$t('actresses.toolbar.ascending')}">
					<ArrowUpDown class="h-4 w-4" />
					{sortOrder === 'asc' ? $t('actresses.toolbar.ascending') : $t('actresses.toolbar.descending')}
				</Button>
			</div>
		</div>
		<div class="mt-3 text-sm text-muted-foreground">
			{$t('actresses.toolbar.showingCount', { values: { visible: actressesCount, total } })}
			{#if activeQuery}
				{$t('actresses.toolbar.searchQuery', { values: { query: activeQuery } })}
			{/if}
		</div>
		<div class="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-input bg-muted/20 px-3 py-2">
			<span class="text-sm">
				{$t('actresses.toolbar.selectedCount', { values: { count: selectedIds.length } })}
			</span>
			<Button variant="outline" size="sm" onclick={onSelectCurrentPage}>{$t('actresses.toolbar.selectPage')}</Button>
			<Button variant="outline" size="sm" onclick={onClearSelection} disabled={selectedIds.length === 0}>
				{$t('actresses.toolbar.clearSelection')}
			</Button>
			<Button size="sm" onclick={onStartMergeSelected} disabled={selectedIds.length < 2}>
				<GitMerge class="h-4 w-4" />
				{$t('actresses.toolbar.mergeSelected')}
			</Button>
		</div>
	</Card>
</div>
