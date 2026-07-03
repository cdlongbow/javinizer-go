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

	function getSelectedView(): string {
		return config.webui?.default_review_view || 'grid-poster';
	}

	function setSelectedView(value: string) {
		if (!config.webui) config.webui = {};
		config.webui.default_review_view = value;
	}
</script>

<SettingsSection title={$t('settings.webui.title')} description={$t('settings.webui.description')} defaultExpanded={false}>
	<div class="space-y-4">
		<div>
			<label class="block text-sm font-medium mb-2" for="webui-default-review-view">{$t('settings.webui.defaultReviewView')}</label>
			<select
				id="webui-default-review-view"
				value={getSelectedView()}
				onchange={(e) => setSelectedView((e.target as HTMLSelectElement).value)}
				class={inputClass}
			>
				<option value="grid-poster">{$t('settings.webui.gridPoster')}</option>
				<option value="grid-cover">{$t('settings.webui.gridCover')}</option>
				<option value="detail">{$t('settings.webui.detail')}</option>
			</select>
			<p class="text-xs text-muted-foreground mt-1">
				{$t('settings.webui.defaultReviewViewHint')}
			</p>
		</div>
	</div>
</SettingsSection>