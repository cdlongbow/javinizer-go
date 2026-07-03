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

<SettingsSection title={$t('settings.performance.title')} description={$t('settings.performance.description')} defaultExpanded={false}>
	<div class="space-y-4">
		<div>
			<label class="block text-sm font-medium mb-2" for="max-workers">
				{$t('settings.performance.maxWorkers')}
			</label>
			<input
				id="max-workers"
				type="number"
				bind:value={config.performance.max_workers}
				class={inputClass}
				min="1"
				max="20"
			/>
			<p class="text-xs text-muted-foreground mt-1">
				{$t('settings.performance.maxWorkersHint')}
			</p>
		</div>

		<div>
			<label class="block text-sm font-medium mb-2" for="worker-timeout">{$t('settings.performance.workerTimeout')}</label>
			<input
				id="worker-timeout"
				type="number"
				bind:value={config.performance.worker_timeout}
				class={inputClass}
				min="5"
				max="600"
			/>
		</div>

		<div>
			<label class="block text-sm font-medium mb-2" for="buffer-size">{$t('settings.performance.bufferSize')}</label>
			<input
				id="buffer-size"
				type="number"
				bind:value={config.performance.buffer_size}
				class={inputClass}
				min="10"
				max="1000"
			/>
			<p class="text-xs text-muted-foreground mt-1">
				{$t('settings.performance.bufferSizeHint')}
			</p>
		</div>

		<div>
			<label class="block text-sm font-medium mb-2" for="update-interval">{$t('settings.performance.uiUpdateInterval')}</label>
			<input
				id="update-interval"
				type="number"
				bind:value={config.performance.update_interval}
				class={inputClass}
				min="50"
				max="1000"
			/>
			<p class="text-xs text-muted-foreground mt-1">
				{$t('settings.performance.uiUpdateIntervalHint')}
			</p>
		</div>
	</div>
</SettingsSection>