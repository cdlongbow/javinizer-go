<script lang="ts">
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n/setup';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import SettingsSubsection from '$lib/components/settings/SettingsSubsection.svelte';
	import FormTemplateInput from '$lib/components/settings/FormTemplateInput.svelte';
	import FormTextInput from '$lib/components/settings/FormTextInput.svelte';
	import FormToggle from '$lib/components/settings/FormToggle.svelte';
	import type { SettingsConfig } from '$lib/api/types';

	interface Props {
		config: SettingsConfig;
	}

	let { config }: Props = $props();
	const nfoEnabled = $derived(config?.metadata?.nfo?.enabled ?? true);
</script>

<SettingsSection title={$t('settings.nfo.title')} description={$t('settings.nfo.description')} defaultExpanded={false}>
	<SettingsSubsection title={$t('settings.nfo.basicOptions')}>
		<FormToggle
			label={$t('settings.nfo.enableGeneration')}
			description={$t('settings.nfo.enableGenerationDesc')}
			checked={config.metadata.nfo?.enabled ?? true}
			onchange={(val) => {
				if (!config.metadata.nfo) config.metadata.nfo = {};
				config.metadata.nfo.enabled = val;
			}}
		/>

		<fieldset disabled={!nfoEnabled} class={`space-y-0 ${!nfoEnabled ? 'opacity-60' : ''}`}>
			<FormToggle
				label={$t('settings.nfo.perFile')}
				description={$t('settings.nfo.perFileDesc')}
				checked={config.metadata.nfo?.per_file ?? false}
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.per_file = val;
				}}
			/>

			<FormTemplateInput
				label={$t('settings.nfo.displayTitleTemplate')}
				description={$t('settings.nfo.displayTitleTemplateDesc')}
				value={config.metadata.nfo?.display_title ?? '[<ID>] <TITLE>'}
				placeholder="[<ID>] <TITLE>"
				showTagList={true}
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.display_title = val;
				}}
			/>

			<FormTemplateInput
				label={$t('settings.nfo.filenameTemplate')}
				description={$t('settings.nfo.filenameTemplateDesc')}
				value={config.metadata.nfo?.filename_template ?? '<ID>'}
				placeholder="<ID>"
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.filename_template = val;
				}}
			/>
		</fieldset>
	</SettingsSubsection>

	<SettingsSubsection title={$t('settings.nfo.actressSettings')}>
		<fieldset disabled={!nfoEnabled} class={`space-y-0 ${!nfoEnabled ? 'opacity-60' : ''}`}>
			<FormToggle
				label={$t('settings.nfo.firstNameOrder')}
				description={$t('settings.nfo.firstNameOrderDesc')}
				checked={config.metadata.nfo?.first_name_order ?? false}
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.first_name_order = val;
				}}
			/>

			<FormToggle
				label={$t('settings.nfo.japaneseNames')}
				description={$t('settings.nfo.japaneseNamesDesc')}
				checked={config.metadata.nfo?.actress_language_ja ?? false}
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.actress_language_ja = val;
				}}
			/>

			<FormToggle
				label={$t('settings.nfo.unknownActressFallback')}
				description={$t('settings.nfo.unknownActressFallbackDesc')}
				checked={config.metadata.nfo?.unknown_actress_mode === 'fallback'}
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.unknown_actress_mode = val ? 'fallback' : 'skip';
				}}
			/>

			{#if config.metadata.nfo?.unknown_actress_mode === 'fallback'}
			<FormTextInput
				label={$t('settings.nfo.unknownActressText')}
				description={$t('settings.nfo.unknownActressTextDesc')}
				value={config.metadata.nfo?.unknown_actress_text ?? 'Unknown'}
				placeholder="Unknown"
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.unknown_actress_text = val;
				}}
			/>
			{/if}

			<FormToggle
				label={$t('settings.nfo.actressAsTag')}
				description={$t('settings.nfo.actressAsTagDesc')}
				checked={config.metadata.nfo?.actress_as_tag ?? false}
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.actress_as_tag = val;
				}}
			/>

			<FormToggle
				label={$t('settings.nfo.addGenericRole')}
				description={$t('settings.nfo.addGenericRoleDesc')}
				checked={config.metadata.nfo?.add_generic_role ?? false}
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.add_generic_role = val;
				}}
			/>

			<FormToggle
				label={$t('settings.nfo.useAlternateNameRole')}
				description={$t('settings.nfo.useAlternateNameRoleDesc')}
				checked={config.metadata.nfo?.alt_name_role ?? false}
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.alt_name_role = val;
				}}
			/>
		</fieldset>
	</SettingsSubsection>

	<SettingsSubsection title={$t('settings.nfo.mediaInfo')}>
		<fieldset disabled={!nfoEnabled} class={`space-y-0 ${!nfoEnabled ? 'opacity-60' : ''}`}>
			<FormToggle
				label={$t('settings.nfo.includeStreamDetails')}
				description={$t('settings.nfo.includeStreamDetailsDesc')}
				checked={config.metadata.nfo?.include_stream_details ?? false}
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.include_stream_details = val;
				}}
			/>

			<FormToggle
				label={$t('settings.nfo.includeFanart')}
				description={$t('settings.nfo.includeFanartDesc')}
				checked={config.metadata.nfo?.include_fanart ?? true}
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.include_fanart = val;
				}}
			/>

			<FormToggle
				label={$t('settings.nfo.includeTrailer')}
				description={$t('settings.nfo.includeTrailerDesc')}
				checked={config.metadata.nfo?.include_trailer ?? true}
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.include_trailer = val;
				}}
			/>

			<FormTextInput
				label={$t('settings.nfo.ratingSource')}
				description={$t('settings.nfo.ratingSourceDesc')}
				value={config.metadata.nfo?.rating_source ?? 'r18dev'}
				placeholder="r18dev"
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.rating_source = val;
				}}
			/>
		</fieldset>
	</SettingsSubsection>

	<SettingsSubsection title={$t('settings.nfo.advancedOptions')}>
		<fieldset disabled={!nfoEnabled} class={`space-y-0 ${!nfoEnabled ? 'opacity-60' : ''}`}>
			<FormToggle
				label={$t('settings.nfo.includeOriginalPath')}
				description={$t('settings.nfo.includeOriginalPathDesc')}
				checked={config.metadata.nfo?.include_originalpath ?? false}
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.include_originalpath = val;
				}}
			/>

			<FormTemplateInput
				label={$t('settings.nfo.tagTemplate')}
				description={$t('settings.nfo.tagTemplateDesc')}
				value={(Array.isArray(config.metadata.nfo?.tag) ? config.metadata.nfo.tag.join(', ') : config.metadata.nfo?.tag) ?? '<SET>'}
				placeholder="<SET>"
				showTagList={true}
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.tag = val
						.split(',')
						.map((s) => s.trim())
						.filter((s) => s.length > 0);
				}}
			/>

			<FormTemplateInput
				label={$t('settings.nfo.taglineTemplate')}
				description={$t('settings.nfo.taglineTemplateDesc')}
				value={config.metadata.nfo?.tagline ?? ''}
				placeholder=""
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.tagline = val;
				}}
			/>

			<FormTextInput
				label={$t('settings.nfo.credits')}
				description={$t('settings.nfo.creditsDesc')}
				value={config.metadata.nfo?.credits?.join(', ') ?? ''}
				placeholder="Director Name, Studio Name"
				onchange={(val) => {
					if (!config.metadata.nfo) config.metadata.nfo = {};
					config.metadata.nfo.credits = val
						.split(',')
						.map((s) => s.trim())
						.filter((s) => s.length > 0);
				}}
			/>
		</fieldset>
	</SettingsSubsection>
</SettingsSection>