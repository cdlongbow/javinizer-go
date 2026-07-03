<script lang="ts">
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n/setup';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import SettingsSubsection from '$lib/components/settings/SettingsSubsection.svelte';
	import FormTextInput from '$lib/components/settings/FormTextInput.svelte';
	import FormToggle from '$lib/components/settings/FormToggle.svelte';
	import type { SettingsConfig } from '$lib/api/types';

	interface Props {
		config: SettingsConfig;
		inputClass: string;
	}

	let { config, inputClass }: Props = $props();
</script>

<SettingsSection title={$t('settings.database.title')} description={$t('settings.database.description')} defaultExpanded={false}>
	<div class="mb-4">
		<label class="block text-sm font-medium mb-2" for="database-type">{$t('settings.database.type')}</label>
		<select id="database-type" bind:value={config.database.type} class={inputClass}>
			<option value="sqlite">{$t('settings.database.typeSqlite')}</option>
			<option value="postgres">{$t('settings.database.typePostgres')}</option>
			<option value="mysql">{$t('settings.database.typeMysql')}</option>
		</select>
		<p class="text-xs text-muted-foreground mt-1">
			{$t('settings.database.typeHint')}
		</p>
	</div>

	<div class="mb-4">
		<label class="block text-sm font-medium mb-2" for="database-dsn">{$t('settings.database.path')}</label>
		<input
			id="database-dsn"
			type="text"
			bind:value={config.database.dsn}
			class={inputClass}
			placeholder="data/javinizer.db"
		/>
	</div>

	<SettingsSubsection title={$t('settings.database.actressDb')}>
		<FormToggle
			label={$t('settings.database.autoAddActresses')}
			description={$t('settings.database.autoAddActressesDesc')}
			checked={config.metadata.actress_database?.auto_add ?? false}
			onchange={(val) => {
				if (!config.metadata.actress_database) config.metadata.actress_database = {};
				config.metadata.actress_database.auto_add = val;
			}}
		/>

		<FormToggle
			label={$t('settings.database.convertAliases')}
			description={$t('settings.database.convertAliasesDesc')}
			checked={config.metadata.actress_database?.convert_alias ?? false}
			onchange={(val) => {
				if (!config.metadata.actress_database) config.metadata.actress_database = {};
				config.metadata.actress_database.convert_alias = val;
			}}
		/>
	</SettingsSubsection>

	<SettingsSubsection title={$t('settings.database.tagDb')}>
		<FormToggle
			label={$t('settings.database.enableTagDb')}
			description={$t('settings.database.enableTagDbDesc')}
			checked={config.metadata.tag_database?.enabled ?? false}
			onchange={(val) => {
				if (!config.metadata.tag_database) config.metadata.tag_database = {};
				config.metadata.tag_database.enabled = val;
			}}
		/>
	</SettingsSubsection>

	<SettingsSubsection title={$t('settings.database.advancedMetadata')}>
		<FormTextInput
			label={$t('settings.database.ignoreGenres')}
			description={$t('settings.database.ignoreGenresDesc')}
			value={config.metadata.ignore_genres?.join(', ') ?? ''}
			placeholder="e.g., Sample, Trailer"
			onchange={(val) => {
				config.metadata.ignore_genres = val
					.split(',')
					.map((s) => s.trim())
					.filter((s) => s.length > 0);
			}}
		/>

		<FormTextInput
			label={$t('settings.database.requiredFields')}
			description={$t('settings.database.requiredFieldsDesc')}
			value={config.metadata.required_fields?.join(', ') ?? ''}
			placeholder="e.g., title, actress, studio"
			onchange={(val) => {
				config.metadata.required_fields = val
					.split(',')
					.map((s) => s.trim())
					.filter((s) => s.length > 0);
			}}
		/>
	</SettingsSubsection>
</SettingsSection>