<script lang="ts">
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n/setup';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import FormNumberInput from '$lib/components/settings/FormNumberInput.svelte';
	import FormTextInput from '$lib/components/settings/FormTextInput.svelte';
	import FormToggle from '$lib/components/settings/FormToggle.svelte';
	import type { SettingsConfig, MediaInfoConfig } from '$lib/api/types';

	interface Props {
		config: SettingsConfig;
	}

	let { config }: Props = $props();
	const mediaInfoCliEnabled = $derived(config?.mediainfo?.cli_enabled ?? false);
</script>

<SettingsSection title={$t('settings.mediainfo.title')} description={$t('settings.mediainfo.description')} defaultExpanded={false}>
	<div class="space-y-4">
		<FormToggle
			label={$t('settings.mediainfo.enableCli')}
			description={$t('settings.mediainfo.enableCliDesc')}
			checked={config.mediainfo?.cli_enabled ?? false}
			onchange={(val) => {
				if (!config.mediainfo) config.mediainfo = {} as MediaInfoConfig;
				config.mediainfo.cli_enabled = val;
			}}
		/>

		<fieldset disabled={!mediaInfoCliEnabled} class={`space-y-0 ${!mediaInfoCliEnabled ? 'opacity-60' : ''}`}>
			<FormTextInput
				label={$t('settings.mediainfo.cliPath')}
				description={$t('settings.mediainfo.cliPathDesc')}
				value={config.mediainfo?.cli_path ?? 'mediainfo'}
				placeholder="mediainfo"
				onchange={(val) => {
					if (!config.mediainfo) config.mediainfo = {} as MediaInfoConfig;
					config.mediainfo.cli_path = val;
				}}
			/>

			<FormNumberInput
				label={$t('settings.mediainfo.cliTimeout')}
				description={$t('settings.mediainfo.cliTimeoutDesc')}
				value={config.mediainfo?.cli_timeout ?? 30}
				min={5}
				max={120}
				unit="seconds"
				onchange={(val) => {
					if (!config.mediainfo) config.mediainfo = {} as MediaInfoConfig;
					config.mediainfo.cli_timeout = val;
				}}
			/>
		</fieldset>
	</div>
</SettingsSection>