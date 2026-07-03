<script lang="ts">
	import { untrack } from 'svelte';
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n/setup';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import SettingsSubsection from '$lib/components/settings/SettingsSubsection.svelte';
	import type { SettingsConfig } from '$lib/api/types';

	interface Props {
		config: SettingsConfig;
		inputClass: string;
	}

	let { config, inputClass }: Props = $props();
	let logging = $derived(config.logging);

	function coerceToInt(value: string | number): number {
		if (typeof value === 'number') return value < 0 ? 0 : value;
		const num = parseInt(value, 10);
		if (isNaN(num) || num < 0) return 0;
		return num;
	}

	function ensureLoggingDefaults(cfg: SettingsConfig): void {
		if (!cfg.logging) cfg.logging = {};
		cfg.logging.level ??= 'info';
		cfg.logging.format ??= 'text';
		cfg.logging.output ??= 'stdout';
		cfg.logging.max_size_mb ??= 0;
		cfg.logging.max_backups ??= 0;
		cfg.logging.max_age_days ??= 0;
		cfg.logging.compress ??= false;
	}

	$effect(() => {
		if (config) {
			untrack(() => ensureLoggingDefaults(config));
		}
	});
</script>

<SettingsSection title={$t('settings.logging.title')} description={$t('settings.logging.description')} defaultExpanded={false}>
	<div class="space-y-4">
		<div>
			<label class="block text-sm font-medium mb-2" for="log-level">{$t('settings.logging.level')}</label>
			<select id="log-level" bind:value={logging.level} class={inputClass}>
				<option value="debug">{$t('settings.logging.levelDebug')}</option>
				<option value="info">{$t('settings.logging.levelInfo')}</option>
				<option value="warn">{$t('settings.logging.levelWarning')}</option>
				<option value="error">{$t('settings.logging.levelError')}</option>
			</select>
		</div>

		<div>
			<label class="block text-sm font-medium mb-2" for="log-format">{$t('settings.logging.format')}</label>
			<select id="log-format" bind:value={logging.format} class={inputClass}>
				<option value="text">{$t('settings.logging.formatText')}</option>
				<option value="json">{$t('settings.logging.formatJson')}</option>
			</select>
		</div>

		<div>
			<label class="block text-sm font-medium mb-2" for="log-output">{$t('settings.logging.output')}</label>
			<input
				id="log-output"
				type="text"
				bind:value={logging.output}
				class={inputClass}
				placeholder="stdout or file path"
			/>
			<p class="text-xs text-muted-foreground mt-1">
				{$t('settings.logging.outputHint')}
			</p>
		</div>

		<SettingsSubsection title={$t('settings.logging.rotationTitle')} description={$t('settings.logging.rotationDesc')}>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium mb-2" for="log-max-size">{$t('settings.logging.maxSize')}</label>
					<input
						id="log-max-size"
						type="number"
						value={logging.max_size_mb}
						oninput={(e) => { logging.max_size_mb = coerceToInt((e.target as HTMLInputElement).value); }}
						class={inputClass}
						min="0"
						placeholder="10"
					/>
					<p class="text-xs text-muted-foreground mt-1">
						{$t('settings.logging.maxSizeHint')}
					</p>
				</div>

				<div>
					<label class="block text-sm font-medium mb-2" for="log-max-backups">{$t('settings.logging.maxBackups')}</label>
					<input
						id="log-max-backups"
						type="number"
						value={logging.max_backups}
						oninput={(e) => { logging.max_backups = coerceToInt((e.target as HTMLInputElement).value); }}
						class={inputClass}
						min="0"
						placeholder="5"
					/>
					<p class="text-xs text-muted-foreground mt-1">
						{$t('settings.logging.maxBackupsHint')}
					</p>
				</div>

				<div>
					<label class="block text-sm font-medium mb-2" for="log-max-age">{$t('settings.logging.maxAge')}</label>
					<input
						id="log-max-age"
						type="number"
						value={logging.max_age_days}
						oninput={(e) => { logging.max_age_days = coerceToInt((e.target as HTMLInputElement).value); }}
						class={inputClass}
						min="0"
						placeholder="0"
					/>
					<p class="text-xs text-muted-foreground mt-1">
						{$t('settings.logging.maxAgeHint')}
					</p>
				</div>

				<div class="flex items-center gap-2">
					<input
						id="log-compress"
						type="checkbox"
						bind:checked={logging.compress}
						class="w-4 h-4"
					/>
					<label class="text-sm font-medium" for="log-compress">{$t('settings.logging.compress')}</label>
				</div>
			</div>
		</SettingsSubsection>
	</div>
</SettingsSection>