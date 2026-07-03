<script lang="ts">
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n/setup';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import SettingsSubsection from '$lib/components/settings/SettingsSubsection.svelte';
	import FormTextInput from '$lib/components/settings/FormTextInput.svelte';
	import FormToggle from '$lib/components/settings/FormToggle.svelte';
	import { FolderOutput, FolderOpen, FileText, FileEdit } from 'lucide-svelte';
	import type { OperationMode, SettingsConfig } from '$lib/api/types';

	interface Props {
		config: SettingsConfig;
	}

	let { config }: Props = $props();

	let effectiveMode: OperationMode = $derived(
		(config?.output?.operation_mode || 'organize') as OperationMode
	);

	let noFolderFormat: boolean = $derived(
		!config?.output?.folder_format
	);

	function handleOperationModeChange(mode: OperationMode) {
		config.output.operation_mode = mode;
	}
</script>

<SettingsSection title={$t('settings.fileOperations.title')} description={$t('settings.fileOperations.description')} defaultExpanded={false}>
	<div class="space-y-3">
		<h4 class="text-sm font-medium">{$t('settings.fileOperations.operationMode')}</h4>
		<p class="text-xs text-muted-foreground">{$t('settings.fileOperations.operationModeHint')}</p>
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
			<button
				onclick={() => handleOperationModeChange('organize')}
				class="flex flex-col items-start gap-1 p-3 rounded-lg border-2 text-sm transition-all {effectiveMode === 'organize' ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50'}"
			>
				<div class="font-medium"><FolderOutput size={16} class="inline mr-1" />{$t('settings.fileOperations.modeOrganize')}</div>
				<div class="text-xs text-muted-foreground">{$t('settings.fileOperations.modeOrganizeDesc')}</div>
			</button>

			<button
				onclick={() => handleOperationModeChange('in-place')}
				class="flex flex-col items-start gap-1 p-3 rounded-lg border-2 text-sm transition-all {effectiveMode === 'in-place' ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50'}"
			>
				<div class="font-medium"><FolderOpen size={16} class="inline mr-1" />{$t('settings.fileOperations.modeReorganize')}</div>
				<div class="text-xs text-muted-foreground">{$t('settings.fileOperations.modeReorganizeDesc')}</div>
			</button>

			<button
				onclick={() => handleOperationModeChange('in-place-norenamefolder')}
				class="flex flex-col items-start gap-1 p-3 rounded-lg border-2 text-sm transition-all {effectiveMode === 'in-place-norenamefolder' ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50'}"
			>
				<div class="font-medium"><FileEdit size={16} class="inline mr-1" />{$t('settings.fileOperations.modeRenameFile')}</div>
				<div class="text-xs text-muted-foreground">{$t('settings.fileOperations.modeRenameFileDesc')}</div>
			</button>

			<button
				onclick={() => handleOperationModeChange('metadata-artwork')}
				class="flex flex-col items-start gap-1 p-3 rounded-lg border-2 text-sm transition-all {effectiveMode === 'metadata-artwork' ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50'}"
			>
				<div class="font-medium"><FileText size={16} class="inline mr-1" />{$t('settings.fileOperations.modeMetadataArtwork')}</div>
				<div class="text-xs text-muted-foreground">{$t('settings.fileOperations.modeMetadataArtworkDesc')}</div>
			</button>
		</div>
		{#if effectiveMode === 'organize' && noFolderFormat}
			<p class="text-xs text-muted-foreground">
				{$t('settings.fileOperations.noFolderTemplate')}
			</p>
		{/if}
	</div>

	<FormToggle
		label={$t('settings.fileOperations.renameFile')}
		description={$t('settings.fileOperations.renameFileDesc')}
		checked={config.output.rename_file ?? true}
		onchange={(val) => {
			config.output.rename_file = val;
		}}
	/>

	<SettingsSubsection title={$t('settings.fileOperations.revert')}>
		<FormToggle
			label={$t('settings.fileOperations.allowRevert')}
			description={$t('settings.fileOperations.allowRevertDesc')}
			checked={config.output.allow_revert ?? false}
			onchange={(val) => {
				config.output.allow_revert = val;
			}}
		/>
	</SettingsSubsection>

	<SettingsSubsection title={$t('settings.fileOperations.subtitleHandling')}>
		<FormToggle
			label={$t('settings.fileOperations.moveSubtitles')}
			description={$t('settings.fileOperations.moveSubtitlesDesc')}
			checked={config.output.move_subtitles ?? false}
			onchange={(val) => {
				config.output.move_subtitles = val;
			}}
		/>

		<FormTextInput
			label={$t('settings.fileOperations.subtitleExtensions')}
			description={$t('settings.fileOperations.subtitleExtensionsDesc')}
			value={config.output.subtitle_extensions?.join(', ') ?? '.srt, .ass, .ssa, .sub, .vtt'}
			placeholder=".srt, .ass, .ssa, .sub, .vtt"
			onchange={(val) => {
				config.output.subtitle_extensions = val
					.split(',')
					.map((s) => s.trim())
					.filter((s) => s.length > 0);
			}}
		/>
	</SettingsSubsection>
</SettingsSection>