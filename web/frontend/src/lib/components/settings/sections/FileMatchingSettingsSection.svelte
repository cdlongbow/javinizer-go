<script lang="ts">
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n/setup';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import type { SettingsConfig } from '$lib/api/types';

	interface Props {
		config: SettingsConfig;
		inputClass: string;
	}

	let { config, inputClass }: Props = $props();
</script>

<SettingsSection title={$t('settings.fileMatching.title')} description={$t('settings.fileMatching.description')} defaultExpanded={false}>
	<div class="space-y-4">
		<div>
			<label class="block text-sm font-medium mb-2" for="file-extensions">{$t('settings.fileMatching.extensions')}</label>
			<input
				id="file-extensions"
				type="text"
				value={config.file_matching.extensions?.join(', ') ?? ''}
				onchange={(e) => {
					config.file_matching.extensions = e.currentTarget.value
						.split(',')
						.map((s) => s.trim());
				}}
				class={inputClass}
				placeholder=".mp4, .mkv, .avi"
			/>
			<p class="text-xs text-muted-foreground mt-1">
				{$t('settings.fileMatching.extensionsHint')}
			</p>
		</div>

		<div>
			<label class="block text-sm font-medium mb-2" for="min-size-mb">{$t('settings.fileMatching.minSize')}</label>
			<input
				id="min-size-mb"
				type="number"
				bind:value={config.file_matching.min_size_mb}
				class={inputClass}
				min="0"
				max="10000"
			/>
			<p class="text-xs text-muted-foreground mt-1">
				{$t('settings.fileMatching.minSizeHint')}
			</p>
		</div>

		<div>
			<label class="block text-sm font-medium mb-2" for="exclude-patterns">{$t('settings.fileMatching.excludePatterns')}</label>
			<input
				id="exclude-patterns"
				type="text"
				value={config.file_matching.exclude_patterns?.join(', ') ?? ''}
				onchange={(e) => {
					config.file_matching.exclude_patterns = e.currentTarget.value
						.split(',')
						.map((s) => s.trim())
						.filter((s) => s.length > 0);
				}}
				class={inputClass}
				placeholder="*-trailer*, *-sample*"
			/>
			<p class="text-xs text-muted-foreground mt-1">
				{$t('settings.fileMatching.excludePatternsHint')}
			</p>
		</div>

			<div class="space-y-3">
				<label class="flex items-center gap-2">
					<input type="checkbox" bind:checked={config.file_matching.regex_enabled} class="rounded" />
					<span>{$t('settings.fileMatching.enableCustomRegex')}</span>
				</label>
			</div>

			<fieldset disabled={!config.file_matching.regex_enabled} class={`${!config.file_matching.regex_enabled ? 'opacity-60' : ''}`}>
				<div>
					<label class="block text-sm font-medium mb-2" for="regex-pattern">{$t('settings.fileMatching.regexPattern')}</label>
					<input
						id="regex-pattern"
						type="text"
						bind:value={config.file_matching.regex_pattern}
						class="{inputClass} font-mono text-sm"
					/>
					<p class="text-xs text-muted-foreground mt-1">
						{$t('settings.fileMatching.regexPatternHint')}
					</p>
				</div>
			</fieldset>
		</div>
	</SettingsSection>