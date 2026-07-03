<script lang="ts">
	import { slide } from 'svelte/transition';
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n/setup';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import SettingsSubsection from '$lib/components/settings/SettingsSubsection.svelte';
	import FormToggle from '$lib/components/settings/FormToggle.svelte';
	import FormNumberInput from '$lib/components/settings/FormNumberInput.svelte';
	import FormTextInput from '$lib/components/settings/FormTextInput.svelte';
	import type { BrowserConfig, ScrapersConfig, SettingsConfig } from '$lib/api/types';

	interface Props {
		config: SettingsConfig;
		inputClass: string;
		onChange: (path: string, value: unknown) => void;
	}

	let { config, inputClass, onChange }: Props = $props();

	function getBrowserValue<K extends keyof BrowserConfig>(
		key: K,
		defaultValue: NonNullable<BrowserConfig[K]>
	): NonNullable<BrowserConfig[K]> {
		return (config.scrapers?.browser?.[key] ?? defaultValue) as NonNullable<BrowserConfig[K]>;
	}

	const BROWSER_DEFAULTS: BrowserConfig = {
		enabled: false,
		binary_path: '',
		timeout: 30,
		max_retries: 3,
		headless: true,
		stealth_mode: true,
		window_width: 1920,
		window_height: 1080,
		slow_mo: 0,
		block_images: true,
		block_css: false,
		user_agent: '',
		debug_visible: false
	};

	const browserEnabled = $derived(config.scrapers?.browser?.enabled ?? false);
</script>

<SettingsSection
	title={$t('settings.browser.title')}
	description={$t('settings.browser.description')}
	defaultExpanded={false}
>
	<SettingsSubsection title={$t('settings.browser.general')}>
		<FormToggle
			id="browser-enabled"
			label={$t('settings.browser.enableBrowser')}
			description={$t('settings.browser.enableBrowserDesc')}
			checked={getBrowserValue('enabled', BROWSER_DEFAULTS.enabled)}
			onchange={(val) => onChange('scrapers.browser.enabled', val)}
		/>
	</SettingsSubsection>

	{#if browserEnabled}
		<div transition:slide={{ duration: 200 }}>
			<SettingsSubsection title={$t('settings.browser.browserConfig')}>
				<fieldset class="space-y-0">
					<FormTextInput
						id="browser-binary-path"
						label={$t('settings.browser.binaryPath')}
						description={$t('settings.browser.binaryPathDesc')}
						value={getBrowserValue('binary_path', '')}
						placeholder="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
						onchange={(val) => onChange('scrapers.browser.binary_path', val)}
					/>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-border">
						<FormNumberInput
							id="browser-timeout"
							label={$t('settings.browser.operationTimeout')}
							description={$t('settings.browser.operationTimeoutDesc')}
							value={getBrowserValue('timeout', BROWSER_DEFAULTS.timeout)}
							min={1}
							max={300}
							unit="seconds"
							onchange={(val) => onChange('scrapers.browser.timeout', val)}
						/>
						<FormNumberInput
							id="browser-max-retries"
							label={$t('settings.browser.maxRetries')}
							description={$t('settings.browser.maxRetriesDesc')}
							value={getBrowserValue('max_retries', BROWSER_DEFAULTS.max_retries)}
							min={0}
							max={10}
							onchange={(val) => onChange('scrapers.browser.max_retries', val)}
						/>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-border">
						<FormNumberInput
							id="browser-window-width"
							label={$t('settings.browser.windowWidth')}
							description={$t('settings.browser.windowWidthDesc')}
							value={getBrowserValue('window_width', BROWSER_DEFAULTS.window_width)}
							min={640}
							max={3840}
							unit="px"
							onchange={(val) => onChange('scrapers.browser.window_width', val)}
						/>
						<FormNumberInput
							id="browser-window-height"
							label={$t('settings.browser.windowHeight')}
							description={$t('settings.browser.windowHeightDesc')}
							value={getBrowserValue('window_height', BROWSER_DEFAULTS.window_height)}
							min={480}
							max={2160}
							unit="px"
							onchange={(val) => onChange('scrapers.browser.window_height', val)}
						/>
					</div>

					<FormTextInput
						id="browser-user-agent"
						label={$t('settings.browser.userAgentOverride')}
						description={$t('settings.browser.userAgentOverrideDesc')}
						value={getBrowserValue('user_agent', '')}
						placeholder="Mozilla/5.0..."
						onchange={(val) => onChange('scrapers.browser.user_agent', val)}
					/>
				</fieldset>
			</SettingsSubsection>

			<SettingsSubsection title={$t('settings.browser.performance')}>
				<fieldset class="space-y-0">
					<FormToggle
						id="browser-headless"
						label={$t('settings.browser.headless')}
						description={$t('settings.browser.headlessDesc')}
						checked={getBrowserValue('headless', BROWSER_DEFAULTS.headless)}
						onchange={(val) => onChange('scrapers.browser.headless', val)}
					/>
					<FormToggle
						id="browser-stealth-mode"
						label={$t('settings.browser.stealth')}
						description={$t('settings.browser.stealthDesc')}
						checked={getBrowserValue('stealth_mode', BROWSER_DEFAULTS.stealth_mode)}
						onchange={(val) => onChange('scrapers.browser.stealth_mode', val)}
					/>
					<FormToggle
						id="browser-block-images"
						label={$t('settings.browser.blockImages')}
						description={$t('settings.browser.blockImagesDesc')}
						checked={getBrowserValue('block_images', BROWSER_DEFAULTS.block_images)}
						onchange={(val) => onChange('scrapers.browser.block_images', val)}
					/>
					<FormToggle
						id="browser-block-css"
						label={$t('settings.browser.blockCss')}
						description={$t('settings.browser.blockCssDesc')}
						checked={getBrowserValue('block_css', BROWSER_DEFAULTS.block_css)}
						onchange={(val) => onChange('scrapers.browser.block_css', val)}
					/>
				</fieldset>
			</SettingsSubsection>

			<SettingsSubsection title={$t('settings.browser.debug')}>
				<fieldset class="space-y-0">
					<FormNumberInput
						id="browser-slow-mo"
						label={$t('settings.browser.slowMo')}
						description={$t('settings.browser.slowMoDesc')}
						value={getBrowserValue('slow_mo', BROWSER_DEFAULTS.slow_mo)}
						min={0}
						max={5000}
						unit="ms"
						onchange={(val) => onChange('scrapers.browser.slow_mo', val)}
					/>
					<FormToggle
						id="browser-debug-visible"
						label={$t('settings.browser.debugVisible')}
						description={$t('settings.browser.debugVisibleDesc')}
						checked={getBrowserValue('debug_visible', BROWSER_DEFAULTS.debug_visible)}
						onchange={(val) => onChange('scrapers.browser.debug_visible', val)}
					/>
				</fieldset>
			</SettingsSubsection>
		</div>
	{/if}
</SettingsSection>