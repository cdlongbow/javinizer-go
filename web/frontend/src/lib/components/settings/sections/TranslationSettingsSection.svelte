<script lang="ts">
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n/setup';
	import { RefreshCw, ChevronDown, Check } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import SettingsSubsection from '$lib/components/settings/SettingsSubsection.svelte';
	import FormNumberInput from '$lib/components/settings/FormNumberInput.svelte';
	import FormPasswordInput from '$lib/components/settings/FormPasswordInput.svelte';
	import FormTextInput from '$lib/components/settings/FormTextInput.svelte';
	import FormToggle from '$lib/components/settings/FormToggle.svelte';
	import { apiClient } from '$lib/api/client';
	import type { DeepLUsageResponse, SettingsConfig, TranslationConfig as TranslationConfigType, OpenAICompatibleTranslationConfig as OpenAICompatibleTranslationConfigType, AnthropicTranslationConfig as AnthropicTranslationConfigType, DeepLTranslationConfig as DeepLTranslationConfigType, GoogleTranslationConfig as GoogleTranslationConfigType, TranslationFieldsConfig as TranslationFieldsConfigType } from '$lib/api/types';

	interface Props {
		config: SettingsConfig;
		inputClass: string;
		fetchTranslationModels: () => Promise<void>;
		fetchingTranslationModels: boolean;
		translationModelOptions: string[];
	}

	let {
		config,
		inputClass,
		fetchTranslationModels,
		fetchingTranslationModels,
		translationModelOptions
	}: Props = $props();
	const translationEnabled = $derived(config?.metadata?.translation?.enabled ?? false);

	let deeplUsage: DeepLUsageResponse | null = $state<DeepLUsageResponse | null>(null);
	let fetchingDeepLUsage = $state(false);
	let deeplUsageError = $state<string | null>(null);
	let advancedExpanded = $state(false);

	const usagePercentage = $derived(
		deeplUsage && deeplUsage.character_limit > 0
			? (deeplUsage.character_count / deeplUsage.character_limit) * 100
			: 0
	);

	function formatNumber(n: number): string {
		if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
		if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
		if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
		return n.toString();
	}

	async function fetchDeepLUsage() {
		const apiKey = config.metadata.translation?.deepl?.api_key ?? '';
		if (!apiKey.trim()) {
			deeplUsageError = get(t)('settings.translation.apiKeyRequired');
			return;
		}

		fetchingDeepLUsage = true;
		deeplUsageError = null;
		deeplUsage = null;

		try {
			const mode = config.metadata.translation?.deepl?.mode ?? 'free';
			const baseURL = config.metadata.translation?.deepl?.base_url ?? '';
			deeplUsage = await apiClient.getDeepLUsage({
				mode,
				base_url: baseURL,
				api_key: apiKey
			});
		} catch (err: unknown) {
			deeplUsageError = err instanceof Error ? err.message : get(t)('settings.translation.fetchUsageFailed');
		} finally {
			fetchingDeepLUsage = false;
		}
	}
</script>

<SettingsSection title={$t('settings.translation.title')} description={$t('settings.translation.description')} defaultExpanded={false}>
	<SettingsSubsection title={$t('settings.translation.general')}>
		<FormToggle
			label={$t('settings.translation.enable')}
			description={$t('settings.translation.enableDesc')}
			checked={config.metadata.translation?.enabled ?? false}
			onchange={(val) => {
				if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
				config.metadata.translation!.enabled = val;
			}}
		/>

		<fieldset disabled={!translationEnabled} class={`space-y-0 ${!translationEnabled ? 'opacity-60' : ''}`}>
			<div class="py-4 border-b border-border">
				<label class="block text-sm font-medium mb-2" for="translation-provider">{$t('settings.translation.provider')}</label>
				<select id="translation-provider" bind:value={config.metadata.translation!.provider} class={inputClass}>
					<option value="openai">{$t('settings.translation.providerOpenai')}</option>
					<option value="openai-compatible">{$t('settings.translation.providerOpenaiCompatible')}</option>
					<option value="anthropic">{$t('settings.translation.providerAnthropic')}</option>
					<option value="deepl">{$t('settings.translation.providerDeepL')}</option>
					<option value="google">{$t('settings.translation.providerGoogle')}</option>
				</select>
			</div>
		</fieldset>
	</SettingsSubsection>

	{#if config.metadata.translation?.provider === 'openai'}
		<SettingsSubsection title={$t('settings.translation.openaiProvider')}>
			<fieldset disabled={!translationEnabled} class={`space-y-0 ${!translationEnabled ? 'opacity-60' : ''}`}>
				<FormTextInput
					label={$t('settings.translation.openaiBaseUrl')}
					description={$t('settings.translation.openaiBaseUrlDesc')}
					value={config.metadata.translation?.openai?.base_url ?? 'https://api.openai.com/v1'}
					placeholder="https://api.openai.com/v1"
					onchange={(val) => {
						if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
						if (!config.metadata.translation!.openai) config.metadata.translation!.openai = {};
						config.metadata.translation!.openai.base_url = val.trim();
					}}
				/>

				<div class="py-4 border-b border-border">
					<div class="flex items-center justify-between mb-2 gap-2">
						<label class="block text-sm font-medium" for="translation-openai-model-select">{$t('settings.translation.openaiModel')}</label>
						<Button
							variant="outline"
							size="sm"
							onclick={fetchTranslationModels}
							disabled={
								fetchingTranslationModels ||
								!(config.metadata.translation?.openai?.base_url ?? '').trim() ||
								!(config.metadata.translation?.openai?.api_key ?? '').trim()
							}
						>
							{#snippet children()}
								<RefreshCw class={`h-4 w-4 mr-2 ${fetchingTranslationModels ? 'animate-spin' : ''}`} />
								{fetchingTranslationModels ? $t('settings.translation.openaiFetching') : $t('settings.translation.openaiFetchModels')}
							{/snippet}
						</Button>
					</div>

					{#if translationModelOptions.length > 0}
						<select id="translation-openai-model-select" bind:value={config.metadata.translation!.openai!.model} class={inputClass}>
							{#each translationModelOptions as modelName}
								<option value={modelName}>{modelName}</option>
							{/each}
						</select>
						<p class="text-xs text-muted-foreground mt-1">
							{$t('settings.translation.openaiModelHint', { values: { url: config.metadata.translation?.openai?.base_url } })}
						</p>
					{/if}

					<input
						id="translation-openai-model-input"
						type="text"
						value={config.metadata.translation?.openai?.model ?? 'gpt-4o-mini'}
						oninput={(e) => {
							if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
							if (!config.metadata.translation!.openai) config.metadata.translation!.openai = {};
							config.metadata.translation!.openai.model = e.currentTarget.value.trim();
						}}
						class="{inputClass} mt-3"
						placeholder="gpt-4o-mini"
					/>
					<p class="text-xs text-muted-foreground mt-1">{$t('settings.translation.openaiManualOverride')}</p>
				</div>

				<FormPasswordInput
					label={$t('settings.translation.openaiApiKey')}
					description={$t('settings.translation.openaiApiKeyDesc')}
					value={config.metadata.translation?.openai?.api_key ?? ''}
					onchange={(val) => {
						if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
						if (!config.metadata.translation!.openai) config.metadata.translation!.openai = {};
						config.metadata.translation!.openai.api_key = val;
					}}
				/>
			</fieldset>
		</SettingsSubsection>
	{:else if config.metadata.translation?.provider === 'openai-compatible'}
		<SettingsSubsection title={$t('settings.translation.openaiCompatibleProvider')}>
			<fieldset disabled={!translationEnabled} class={`space-y-0 ${!translationEnabled ? 'opacity-60' : ''}`}>
				<FormTextInput
					label={$t('settings.translation.openaiBaseUrl')}
					description={$t('settings.translation.openaiCompatibleBaseUrlDesc')}
					value={config.metadata.translation?.['openai_compatible']?.base_url ?? 'http://localhost:11434/v1'}
					placeholder="http://localhost:11434/v1"
					onchange={(val) => {
						if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
						if (!config.metadata.translation!['openai_compatible']) config.metadata.translation!['openai_compatible'] = {} as OpenAICompatibleTranslationConfigType;
						config.metadata.translation!['openai_compatible'].base_url = val.trim();
					}}
				/>

				<div class="py-4 border-b border-border">
					<div class="flex items-center justify-between mb-2 gap-2">
						<label class="block text-sm font-medium" for="translation-openai_compatible-model-select">{$t('settings.translation.openaiModel')}</label>
						<Button
							variant="outline"
							size="sm"
							onclick={fetchTranslationModels}
							disabled={
								fetchingTranslationModels ||
								!(config.metadata.translation?.['openai_compatible']?.base_url ?? '').trim()
							}
						>
							{#snippet children()}
								<RefreshCw class={`h-4 w-4 mr-2 ${fetchingTranslationModels ? 'animate-spin' : ''}`} />
								{fetchingTranslationModels ? $t('settings.translation.openaiFetching') : $t('settings.translation.openaiFetchModels')}
							{/snippet}
						</Button>
					</div>

					{#if translationModelOptions.length > 0}
						<select id="translation-openai_compatible-model-select" bind:value={config.metadata.translation!['openai_compatible']!.model} class={inputClass}>
							{#each translationModelOptions as modelName}
								<option value={modelName}>{modelName}</option>
							{/each}
						</select>
						<p class="text-xs text-muted-foreground mt-1">
							{$t('settings.translation.openaiModelHint', { values: { url: config.metadata.translation?.['openai_compatible']?.base_url } })}
						</p>
					{/if}

					<input
						id="translation-openai_compatible-model-input"
						type="text"
						value={config.metadata.translation?.['openai_compatible']?.model ?? ''}
						oninput={(e) => {
							if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
							if (!config.metadata.translation!['openai_compatible']) config.metadata.translation!['openai_compatible'] = {} as OpenAICompatibleTranslationConfigType;
							config.metadata.translation!['openai_compatible'].model = e.currentTarget.value.trim();
						}}
						class="{inputClass} mt-3"
						placeholder="llama3"
					/>
					<p class="text-xs text-muted-foreground mt-1">{$t('settings.translation.openaiManualOverride')}</p>
				</div>

				<FormPasswordInput
					label={$t('settings.translation.openaiCompatibleApiKey')}
					description={$t('settings.translation.openaiCompatibleApiKeyDesc')}
					value={config.metadata.translation?.['openai_compatible']?.api_key ?? ''}
					onchange={(val) => {
						if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
						if (!config.metadata.translation!['openai_compatible']) config.metadata.translation!['openai_compatible'] = {} as OpenAICompatibleTranslationConfigType;
						config.metadata.translation!['openai_compatible'].api_key = val;
					}}
				/>

				<FormToggle
					label={$t('settings.translation.openaiCompatibleEnableThinking')}
					description={$t('settings.translation.openaiCompatibleEnableThinkingDesc')}
					checked={config.metadata.translation?.['openai_compatible']?.enable_thinking ?? false}
					onchange={(val) => {
						if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
						if (!config.metadata.translation!['openai_compatible']) config.metadata.translation!['openai_compatible'] = {} as OpenAICompatibleTranslationConfigType;
						config.metadata.translation!['openai_compatible'].enable_thinking = val;
					}}
				/>
				
			</fieldset>
		</SettingsSubsection>
	{:else if config.metadata.translation?.provider === 'anthropic'}
		<SettingsSubsection title={$t('settings.translation.anthropicProvider')}>
			<fieldset disabled={!translationEnabled} class={`space-y-0 ${!translationEnabled ? 'opacity-60' : ''}`}>
				<FormTextInput
					label={$t('settings.translation.openaiBaseUrl')}
					description={$t('settings.translation.anthropicBaseUrlDesc')}
					value={config.metadata.translation?.anthropic?.base_url ?? 'https://api.anthropic.com'}
					placeholder="https://api.anthropic.com"
					onchange={(val) => {
						if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
						if (!config.metadata.translation!.anthropic) config.metadata.translation!.anthropic = {} as AnthropicTranslationConfigType;
						config.metadata.translation!.anthropic.base_url = val.trim();
					}}
				/>

				<div class="py-4 border-b border-border">
					<div class="flex items-center justify-between mb-2 gap-2">
						<label class="block text-sm font-medium" for="translation-anthropic-model-select">{$t('settings.translation.openaiModel')}</label>
						<Button
							variant="outline"
							size="sm"
							onclick={fetchTranslationModels}
							disabled={
								fetchingTranslationModels ||
								!(config.metadata.translation?.anthropic?.base_url ?? '').trim() ||
								!(config.metadata.translation?.anthropic?.api_key ?? '').trim()
							}
						>
							{#snippet children()}
								<RefreshCw class={`h-4 w-4 mr-2 ${fetchingTranslationModels ? 'animate-spin' : ''}`} />
								{fetchingTranslationModels ? $t('settings.translation.openaiFetching') : $t('settings.translation.openaiFetchModels')}
							{/snippet}
						</Button>
					</div>

					{#if translationModelOptions.length > 0}
						<select id="translation-anthropic-model-select" bind:value={config.metadata.translation!.anthropic!.model} class={inputClass}>
							{#each translationModelOptions as modelName}
								<option value={modelName}>{modelName}</option>
							{/each}
						</select>
						<p class="text-xs text-muted-foreground mt-1">
							{$t('settings.translation.openaiModelHint', { values: { url: config.metadata.translation?.anthropic?.base_url } })}
						</p>
					{/if}

					<input
						id="translation-anthropic-model-input"
						type="text"
						value={config.metadata.translation?.anthropic?.model ?? ''}
						oninput={(e) => {
							if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
							if (!config.metadata.translation!.anthropic) config.metadata.translation!.anthropic = {} as AnthropicTranslationConfigType;
							config.metadata.translation!.anthropic.model = e.currentTarget.value.trim();
						}}
						class="{inputClass} mt-3"
						placeholder="claude-sonnet-4-20250514"
					/>
					<p class="text-xs text-muted-foreground mt-1">{$t('settings.translation.openaiManualOverride')}</p>
				</div>

				<FormPasswordInput
					label={$t('settings.translation.openaiApiKey')}
					description={$t('settings.translation.anthropicApiKeyDesc')}
					value={config.metadata.translation?.anthropic?.api_key ?? ''}
					onchange={(val) => {
						if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
						if (!config.metadata.translation!.anthropic) config.metadata.translation!.anthropic = {} as AnthropicTranslationConfigType;
						config.metadata.translation!.anthropic.api_key = val;
					}}
				/>
			</fieldset>
		</SettingsSubsection>
	{:else if config.metadata.translation?.provider === 'deepl'}
		<SettingsSubsection title={$t('settings.translation.deeplProvider')}>
			<fieldset disabled={!translationEnabled} class={`space-y-0 ${!translationEnabled ? 'opacity-60' : ''}`}>
				<div class="py-4 border-b border-border">
					<label class="block text-sm font-medium mb-2" for="deepl-mode">{$t('settings.translation.deeplMode')}</label>
					<select id="deepl-mode" bind:value={config.metadata.translation!.deepl!.mode} class={inputClass}>
						<option value="free">{$t('settings.translation.deeplModeFree')}</option>
						<option value="pro">{$t('settings.translation.deeplModePro')}</option>
					</select>
					<p class="text-xs text-muted-foreground mt-1">
						{$t('settings.translation.deeplModeHint')}
					</p>
				</div>

				<FormTextInput
					label={$t('settings.translation.deeplBaseUrl')}
					description={$t('settings.translation.deeplBaseUrlDesc')}
					value={config.metadata.translation?.deepl?.base_url ?? ''}
					placeholder="https://api-free.deepl.com"
					onchange={(val) => {
						if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
						if (!config.metadata.translation!.deepl) config.metadata.translation!.deepl = {} as DeepLTranslationConfigType;
						config.metadata.translation!.deepl.base_url = val.trim();
					}}
				/>

				<FormPasswordInput
					label={$t('settings.translation.deeplApiKey')}
					description={$t('settings.translation.deeplApiKeyDesc')}
					value={config.metadata.translation?.deepl?.api_key ?? ''}
					onchange={(val) => {
						if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
						if (!config.metadata.translation!.deepl) config.metadata.translation!.deepl = {} as DeepLTranslationConfigType;
						config.metadata.translation!.deepl.api_key = val;
					}}
				/>

				<div class="py-4 border-b border-border">
					<div class="flex items-center justify-between mb-3">
						<div>
							<h4 class="text-sm font-medium">{$t('settings.translation.deeplUsage')}</h4>
							<p class="text-xs text-muted-foreground">{$t('settings.translation.deeplUsageDesc')}</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onclick={fetchDeepLUsage}
							disabled={
								fetchingDeepLUsage ||
								!(config.metadata.translation?.deepl?.api_key ?? '').trim()
							}
						>
							{#snippet children()}
								<RefreshCw class={`h-4 w-4 mr-2 ${fetchingDeepLUsage ? 'animate-spin' : ''}`} />
								{fetchingDeepLUsage ? $t('settings.translation.openaiFetching') : $t('settings.translation.deeplRefresh')}
							{/snippet}
						</Button>
					</div>

					{#if deeplUsageError}
						<p class="text-xs text-destructive mb-2">{deeplUsageError}</p>
					{/if}

					{#if deeplUsage}
						<div class="space-y-2">
							<div class="flex items-center justify-between text-sm">
								<span class="font-medium">{$t('settings.translation.deeplCharactersUsed')}</span>
								<span class="text-muted-foreground">
									{formatNumber(deeplUsage.character_count)} / {formatNumber(deeplUsage.character_limit)}
								</span>
							</div>
							<div class="h-3 bg-secondary rounded-full overflow-hidden">
								<div
									class="h-full rounded-full transition-all duration-300 {usagePercentage > 90 ? 'bg-destructive' : usagePercentage > 70 ? 'bg-yellow-500' : 'bg-primary'}"
									style="width: {Math.min(100, usagePercentage)}%"
								></div>
							</div>
							<div class="flex items-center justify-between text-xs text-muted-foreground">
								<span>{$t('settings.translation.deeplPercentUsed', { values: { percent: usagePercentage.toFixed(1) } })}</span>
								<span>{$t('settings.translation.deeplRemaining', { values: { count: formatNumber(deeplUsage.character_limit - deeplUsage.character_count) } })}</span>
							</div>
							{#if deeplUsage.start_time && deeplUsage.end_time}
								<p class="text-xs text-muted-foreground">
									{$t('settings.translation.deeplBillingPeriod', { values: { start: new Date(deeplUsage.start_time).toLocaleDateString(), end: new Date(deeplUsage.end_time).toLocaleDateString() } })}
								</p>
							{/if}
						</div>
					{:else if !fetchingDeepLUsage && !deeplUsageError}
						<p class="text-xs text-muted-foreground">{$t('settings.translation.deeplClickRefresh')}</p>
					{/if}
				</div>
			</fieldset>
		</SettingsSubsection>
	{:else if config.metadata.translation?.provider === 'google'}
		<SettingsSubsection title={$t('settings.translation.googleProvider')}>
			<fieldset disabled={!translationEnabled} class={`space-y-0 ${!translationEnabled ? 'opacity-60' : ''}`}>
				<div class="py-4 border-b border-border">
					<label class="block text-sm font-medium mb-2" for="google-mode">{$t('settings.translation.deeplMode')}</label>
					<select id="google-mode" bind:value={config.metadata.translation!.google!.mode} class={inputClass}>
						<option value="free">{$t('settings.translation.googleModeFree')}</option>
						<option value="paid">{$t('settings.translation.googleModePaid')}</option>
					</select>
				</div>

				<FormTextInput
					label={$t('settings.translation.deeplBaseUrl')}
					description={$t('settings.translation.googleBaseUrlDesc')}
					value={config.metadata.translation?.google?.base_url ?? ''}
					placeholder="https://translation.googleapis.com"
					onchange={(val) => {
						if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
						if (!config.metadata.translation!.google) config.metadata.translation!.google = {} as GoogleTranslationConfigType;
						config.metadata.translation!.google.base_url = val.trim();
					}}
				/>

				<FormPasswordInput
					label={$t('settings.translation.googleApiKey')}
					description={$t('settings.translation.googleApiKeyDesc')}
					value={config.metadata.translation?.google?.api_key ?? ''}
					disabled={config.metadata.translation?.google?.mode !== 'paid'}
					onchange={(val) => {
						if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
						if (!config.metadata.translation!.google) config.metadata.translation!.google = {} as GoogleTranslationConfigType;
						config.metadata.translation!.google.api_key = val;
					}}
				/>
			</fieldset>
		</SettingsSubsection>
	{/if}

	<SettingsSubsection title={$t('settings.translation.options')} isCollapsible={true} isExpanded={advancedExpanded} onToggle={() => advancedExpanded = !advancedExpanded}>
		{#if advancedExpanded}
			<fieldset disabled={!translationEnabled} class={`space-y-0 ${!translationEnabled ? 'opacity-60' : ''}`}>
				<FormTextInput
					label={$t('settings.translation.sourceLanguage')}
					description={$t('settings.translation.sourceLanguageDesc')}
					value={config.metadata.translation?.source_language ?? 'en'}
					placeholder="en"
					onchange={(val) => {
						if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
						config.metadata.translation!.source_language = val.trim();
					}}
				/>

				<FormTextInput
					label={$t('settings.translation.targetLanguage')}
					description={$t('settings.translation.targetLanguageDesc')}
					value={config.metadata.translation?.target_language ?? 'ja'}
					placeholder="ja"
					onchange={(val) => {
						if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
						config.metadata.translation!.target_language = val.trim();
					}}
				/>

				<FormNumberInput
					label={$t('settings.translation.timeout')}
					description={$t('settings.translation.timeoutDesc')}
					value={config.metadata.translation?.timeout_seconds ?? 60}
					min={5}
					max={300}
					unit="seconds"
					onchange={(val) => {
						if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
						config.metadata.translation!.timeout_seconds = val;
					}}
				/>

				<FormToggle
					label={$t('settings.translation.applyToPrimary')}
					description={$t('settings.translation.applyToPrimaryDesc')}
					checked={config.metadata.translation?.apply_to_primary ?? true}
					onchange={(val) => {
						if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
						config.metadata.translation!.apply_to_primary = val;
					}}
				/>

				<FormToggle
					label={$t('settings.translation.overwriteExisting')}
					description={$t('settings.translation.overwriteExistingDesc')}
					checked={config.metadata.translation?.overwrite_existing_target ?? true}
					onchange={(val) => {
						if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
						config.metadata.translation!.overwrite_existing_target = val;
					}}
				/>

				<div class="py-4 border-t border-border">
					<p class="text-sm font-medium mb-3">{$t('settings.translation.fieldsToTranslate')}</p>
					<div class="grid grid-cols-2 gap-x-6 gap-y-1">
						{#each [
							{ key: 'title', label: $t('settings.translation.fieldTitle') },
							{ key: 'original_title', label: $t('settings.translation.fieldOriginalTitle') },
							{ key: 'description', label: $t('settings.translation.fieldDescription') },
							{ key: 'director', label: $t('settings.translation.fieldDirector') },
							{ key: 'maker', label: $t('settings.translation.fieldMaker') },
							{ key: 'label', label: $t('settings.translation.fieldLabel') },
							{ key: 'series', label: $t('settings.translation.fieldSeries') },
							{ key: 'genres', label: $t('settings.translation.fieldGenres') },
							{ key: 'actresses', label: $t('settings.translation.fieldActresses') },
						] as field}
							<label class="flex items-center gap-2 py-1.5 cursor-pointer">
								<div class="relative">
									<input
										type="checkbox"
										checked={config.metadata.translation?.fields?.[field.key] !== false}
										onchange={(e) => {
											if (!config.metadata.translation) config.metadata.translation = {} as TranslationConfigType;
											if (!config.metadata.translation!.fields) config.metadata.translation!.fields = {};
											config.metadata.translation!.fields[field.key] = e.currentTarget.checked;
										}}
										class="peer h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary disabled:opacity-50 cursor-pointer"
									/>
									<Check class="pointer-events-none absolute inset-0 h-4 w-4 text-primary opacity-0 peer-checked:opacity-100" />
								</div>
								<span class="text-sm">{field.label}</span>
							</label>
						{/each}
					</div>
				</div>
			</fieldset>
		{/if}
	</SettingsSubsection>
</SettingsSection>