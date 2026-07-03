<script lang="ts">
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n/setup';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import SettingsSubsection from '$lib/components/settings/SettingsSubsection.svelte';
	import FormNumberInput from '$lib/components/settings/FormNumberInput.svelte';
	import FormTemplateInput from '$lib/components/settings/FormTemplateInput.svelte';
	import FormTextInput from '$lib/components/settings/FormTextInput.svelte';
	import FormToggle from '$lib/components/settings/FormToggle.svelte';
	import type { SettingsConfig } from '$lib/api/types';

	interface Props {
		config: SettingsConfig;
		inputClass: string;
	}

	let { config, inputClass }: Props = $props();
</script>

<SettingsSection title={$t('settings.output.title')} description={$t('settings.output.description')} defaultExpanded={false}>
	<div class="space-y-4">
		<SettingsSubsection title={$t('settings.output.templateOptions')}>
			<FormNumberInput
				label={$t('settings.output.maxTitleLength')}
				description={$t('settings.output.maxTitleLengthDesc')}
				value={config.output.max_title_length ?? 100}
				min={10}
				max={500}
				unit="characters"
				onchange={(val) => {
					config.output.max_title_length = val;
				}}
			/>

			<FormNumberInput
				label={$t('settings.output.maxPathLength')}
				description={$t('settings.output.maxPathLengthDesc')}
				value={config.output.max_path_length ?? 240}
				min={100}
				max={250}
				unit="characters"
				onchange={(val) => {
					config.output.max_path_length = val;
				}}
			/>

			<FormToggle
				label={$t('settings.output.groupActress')}
				description={$t('settings.output.groupActressDesc')}
				checked={config.output.group_actress ?? false}
				onchange={(val) => {
					config.output.group_actress = val;
				}}
			/>

			{#if config.output.group_actress}
				<div class="py-4 border-b border-border">
					<label class="block text-sm font-medium mb-2" for="group-actress-name">{$t('settings.output.groupActressName')}</label>
					<input
						id="group-actress-name"
						type="text"
						bind:value={config.output.group_actress_name}
						class={inputClass}
						placeholder="@Group"
					/>
					<p class="text-xs text-muted-foreground mt-1">
						{$t('settings.output.groupActressNameHint')}
					</p>
				</div>
			{/if}

			<div class="py-4 border-b border-border">
				<label class="block text-sm font-medium mb-2" for="delimiter">{$t('settings.output.delimiter')}</label>
				<input
					id="delimiter"
					type="text"
					bind:value={config.output.actress_delimiter}
					class={inputClass}
					placeholder=", "
				/>
				<p class="text-xs text-muted-foreground mt-1">
					{$t('settings.output.delimiterHint')}
				</p>
			</div>
		</SettingsSubsection>

		<div>
			<label class="block text-sm font-medium mb-2" for="subfolder-format">{$t('settings.output.subfolderFormat')}</label>
			<input
				id="subfolder-format"
				type="text"
				value={config.output.subfolder_format?.join(', ') ?? ''}
				onchange={(e) => {
					config.output.subfolder_format = e.currentTarget.value
						.split(',')
						.map((s) => s.trim())
						.filter((s) => s.length > 0);
				}}
				class={inputClass}
				placeholder={$t('settings.output.subfolderPlaceholder')}
			/>
			<p class="text-xs text-muted-foreground mt-1">
				{$t('settings.output.subfolderFormatHint')}
			</p>
		</div>

		<div class="space-y-3">
			<h3 class="font-medium">{$t('settings.output.downloadOptions')}</h3>
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={config.output.download_poster} class="rounded" />
				<span>{$t('settings.output.downloadPoster')}</span>
			</label>
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={config.output.download_cover} class="rounded" />
				<span>{$t('settings.output.downloadCover')}</span>
			</label>
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={config.output.download_extrafanart} class="rounded" />
				<span>{$t('settings.output.downloadExtrafanart')}</span>
			</label>
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={config.output.download_trailer} class="rounded" />
				<span>{$t('settings.output.downloadTrailer')}</span>
			</label>
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={config.output.download_actress} class="rounded" />
				<span>{$t('settings.output.downloadActressImages')}</span>
			</label>
		</div>

		<FormNumberInput
			label={$t('settings.output.downloadTimeout')}
			description={$t('settings.output.downloadTimeoutDesc')}
			value={config.output.download_timeout ?? 60}
			min={5}
			max={600}
			unit="seconds"
			onchange={(val) => {
				config.output.download_timeout = val;
			}}
		/>

		<div>
			<label class="block text-sm font-medium mb-2" for="folder-format">{$t('settings.output.folderFormat')}</label>
			<input
				id="folder-format"
				type="text"
				bind:value={config.output.folder_format}
				class="{inputClass} font-mono text-sm"
				placeholder="<ID> - <TITLE>"
			/>
			<p class="text-xs text-muted-foreground mt-1">
				{$t('settings.output.folderFormatHint')}
			</p>
			{#if !config.output.folder_format}
				<p class="text-xs text-primary mt-1">
					{$t('settings.output.folderFormatEmptyHint')}
				</p>
			{/if}
		</div>

		<div>
			<label class="block text-sm font-medium mb-2" for="file-format">{$t('settings.output.fileFormat')}</label>
			<input
				id="file-format"
				type="text"
				bind:value={config.output.file_format}
				class="{inputClass} font-mono text-sm"
				placeholder="<ID><PARTSUFFIX>"
			/>
			<p class="text-xs text-muted-foreground mt-1">
				{$t('settings.output.fileFormatHint1')}
			</p>
			<p class="text-xs text-muted-foreground">
				{$t('settings.output.fileFormatHint2')}
			</p>
		</div>

		<SettingsSubsection title={$t('settings.output.mediaFileNaming')}>
			<FormTemplateInput
				label={$t('settings.output.posterFormat')}
				description={$t('settings.output.posterFormatDesc')}
				value={config.output.poster_format ?? '<ID>-poster.jpg'}
				placeholder="<ID>-poster.jpg"
				showTagList={true}
				onchange={(val) => {
					config.output.poster_format = val;
				}}
			/>

			<FormTemplateInput
				label={$t('settings.output.fanartFormat')}
				description={$t('settings.output.fanartFormatDesc')}
				value={config.output.fanart_format ?? '<ID>-fanart.jpg'}
				placeholder="<ID>-fanart.jpg"
				onchange={(val) => {
					config.output.fanart_format = val;
				}}
			/>

			<FormTemplateInput
				label={$t('settings.output.trailerFormat')}
				description={$t('settings.output.trailerFormatDesc')}
				value={config.output.trailer_format ?? '<ID>-trailer.mp4'}
				placeholder="<ID>-trailer.mp4"
				onchange={(val) => {
					config.output.trailer_format = val;
				}}
			/>

			<FormTemplateInput
				label={$t('settings.output.screenshotFormat')}
				description={$t('settings.output.screenshotFormatDesc')}
				value={config.output.screenshot_format ?? 'fanart'}
				placeholder="fanart"
				onchange={(val) => {
					config.output.screenshot_format = val;
				}}
			/>

			<FormTextInput
				label={$t('settings.output.screenshotFolder')}
				description={$t('settings.output.screenshotFolderDesc')}
				value={config.output.screenshot_folder ?? 'extrafanart'}
				placeholder="extrafanart"
				onchange={(val) => {
					config.output.screenshot_folder = val;
				}}
			/>

			<FormNumberInput
				label={$t('settings.output.screenshotPadding')}
				description={$t('settings.output.screenshotPaddingDesc')}
				value={config.output.screenshot_padding ?? 1}
				min={1}
				max={5}
				unit="digits"
				onchange={(val) => {
					config.output.screenshot_padding = val;
				}}
			/>

			<FormTextInput
				label={$t('settings.output.actressFolder')}
				description={$t('settings.output.actressFolderDesc')}
				value={config.output.actress_folder ?? '.actors'}
				placeholder=".actors"
				onchange={(val) => {
					config.output.actress_folder = val;
				}}
			/>

			<FormTemplateInput
				label={$t('settings.output.actressFormat')}
				description={$t('settings.output.actressFormatDesc')}
				value={config.output.actress_format ?? '<ACTORNAME>.jpg'}
				placeholder="<ACTORNAME>.jpg"
				onchange={(val) => {
					config.output.actress_format = val;
				}}
			/>
		</SettingsSubsection>
	</div>
</SettingsSection>