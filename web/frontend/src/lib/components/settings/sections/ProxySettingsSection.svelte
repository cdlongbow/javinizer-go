<script lang="ts">
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n/setup';
	import { RefreshCw, X, Check, AlertTriangle } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import SettingsSubsection from '$lib/components/settings/SettingsSubsection.svelte';
	import FormNumberInput from '$lib/components/settings/FormNumberInput.svelte';
	import FormTextInput from '$lib/components/settings/FormTextInput.svelte';
	import FormToggle from '$lib/components/settings/FormToggle.svelte';
	import type { SettingsConfig, ProxyConfig as ProxyConfigType, FlareSolverrConfig as FlareSolverrConfigType } from '$lib/api/types';

	interface TestResult {
		success: boolean;
		timestamp: number;
		message?: string;
		configSnapshot?: string;
	}

	interface Props {
		config: SettingsConfig;
		inputClass: string;
		testingProxy: boolean;
		testingFlareSolverr: boolean;
		testingProfile: Record<string, boolean>;
		savingProfile: Record<string, boolean>;
		loading: boolean;
		saving: boolean;
		profileTestResults: Record<string, TestResult>;
		globalProxyTestResult: TestResult | null;
		globalFlareSolverrTestResult: TestResult | null;
		canSaveProfile: (name: string) => boolean;
		isTestExpired: (result: TestResult | null | undefined) => boolean;
		invalidateGlobalProxyTest: () => void;
		invalidateGlobalFlareSolverrTest: () => void;
		getProxyProfileNames: () => string[];
		addProxyProfile: () => void;
		renameProxyProfile: (oldName: string, rawNewName: string) => void;
		removeProxyProfile: (name: string) => void;
		setProxyProfileField: (name: string, field: 'url' | 'username' | 'password', value: string) => void;
		saveProxyProfile: (profileName: string) => Promise<void>;
		runNamedProxyProfileTest: (profileName: string) => Promise<void>;
		runProxyTest: (mode: 'direct' | 'flaresolverr') => Promise<void>;
	}

	let {
		config,
		inputClass,
		testingProxy,
		testingFlareSolverr,
		testingProfile,
		savingProfile,
		loading,
		saving,
		profileTestResults,
		globalProxyTestResult,
		globalFlareSolverrTestResult,
		canSaveProfile,
		isTestExpired,
		invalidateGlobalProxyTest,
		invalidateGlobalFlareSolverrTest,
		getProxyProfileNames,
		addProxyProfile,
		renameProxyProfile,
		removeProxyProfile,
		setProxyProfileField,
		saveProxyProfile,
		runNamedProxyProfileTest,
		runProxyTest
	}: Props = $props();
	const scraperProxyEnabled = $derived(config?.scrapers?.proxy?.enabled ?? false);
	const flaresolverrEnabled = $derived(config?.scrapers?.flaresolverr?.enabled ?? false);
</script>

<SettingsSection title={$t('settings.proxy.title')} description={$t('settings.proxy.description')} defaultExpanded={false}>
	<SettingsSubsection title={$t('settings.proxy.scraperProxy')}>
		<FormToggle
			label={$t('settings.proxy.enableProxy')}
			description={$t('settings.proxy.enableProxyDesc')}
			checked={config.scrapers.proxy?.enabled ?? false}
			onchange={(val) => {
				if (!config.scrapers.proxy) config.scrapers.proxy = {} as ProxyConfigType;
				config.scrapers.proxy.enabled = val;
				invalidateGlobalProxyTest();
			}}
		/>

		<fieldset disabled={!scraperProxyEnabled} class={`space-y-0 ${!scraperProxyEnabled ? 'opacity-60' : ''}`}>
			<div class="py-4 border-b border-border">
				<label class="block text-sm font-medium mb-2" for="default-proxy-profile">{$t('settings.proxy.defaultProfile')}</label>
				<select
					id="default-proxy-profile"
					class={inputClass}
					value={config.scrapers.proxy?.default_profile ?? ''}
					onchange={(e) => {
						if (!config.scrapers.proxy) config.scrapers.proxy = {} as ProxyConfigType;
						config.scrapers.proxy.default_profile = e.currentTarget.value;
						invalidateGlobalProxyTest();
					}}
				>
					{#each getProxyProfileNames() as profileName}
						<option value={profileName}>{profileName}</option>
					{/each}
				</select>
				<p class="text-xs text-muted-foreground mt-1">
					{$t('settings.proxy.defaultProfileHint')}
				</p>
			</div>

			<div class="py-4 border-b border-border">
				<div class="flex items-center justify-between mb-3">
					<div>
						<p class="block text-sm font-medium">{$t('settings.proxy.profiles')}</p>
						<p class="text-xs text-muted-foreground mt-1">
							{$t('settings.proxy.profilesHint')}
						</p>
					</div>
					<Button variant="outline" size="sm" onclick={addProxyProfile}>
						{#snippet children()}{$t('settings.proxy.addProfile')}{/snippet}
					</Button>
				</div>

				<div class="space-y-3">
					{#each getProxyProfileNames() as profileName}
						{@const profile = config.scrapers.proxy?.profiles?.[profileName]}
						{@const testResult = profileTestResults[profileName]}
						{@const saveEnabled = canSaveProfile(profileName)}
						{@const hasUrl = (profile?.url ?? '').trim() !== ''}
						<div class="rounded-md border p-3 space-y-2">
							<div class="flex items-center gap-2">
								<input
									type="text"
									value={profileName}
									onchange={(e) => renameProxyProfile(profileName, e.currentTarget.value)}
									class="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-sm"
								/>
								<Button
									variant="ghost"
									size="icon"
									disabled={getProxyProfileNames().length <= 1}
									onclick={() => removeProxyProfile(profileName)}
									class="h-8 w-8"
								>
									{#snippet children()}
										<X class="h-4 w-4" />
									{/snippet}
								</Button>
							</div>
							<input
								type="text"
								value={profile?.url ?? ''}
								placeholder="http://proxy.example.com:8080"
								oninput={(e) => setProxyProfileField(profileName, 'url', e.currentTarget.value)}
								class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-sm"
							/>
							<div class="grid grid-cols-2 gap-2">
								<input
									type="text"
									value={profile?.username ?? ''}
									placeholder={$t('settings.proxy.usernamePlaceholder')}
									oninput={(e) => setProxyProfileField(profileName, 'username', e.currentTarget.value)}
									class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-sm"
								/>
								<input
									type="password"
									value={profile?.password ?? ''}
									placeholder={$t('settings.proxy.passwordPlaceholder')}
									oninput={(e) => setProxyProfileField(profileName, 'password', e.currentTarget.value)}
									class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-sm"
								/>
							</div>
							<div class="flex items-center gap-2 pt-1">
								<Button
									variant="outline"
									size="sm"
									onclick={() => saveProxyProfile(profileName)}
									disabled={!saveEnabled || savingProfile[profileName] || loading || saving}
									title={!testResult
										? $t('settings.proxy.testBeforeSaveTitle')
										: !testResult.success
											? $t('settings.proxy.testFixTitle')
											: isTestExpired(testResult)
												? $t('settings.proxy.testExpiredTitle')
												: $t('settings.proxy.saveVerifiedTitle')}
								>
									{#snippet children()}
										{#if saveEnabled}
											<Check class="h-4 w-4 mr-2 text-green-500" />
										{/if}
										{savingProfile[profileName] ? $t('settings.proxy.saving') : $t('settings.proxy.saveProfile')}
									{/snippet}
								</Button>

								<Button
									variant="outline"
									size="sm"
									onclick={() => runNamedProxyProfileTest(profileName)}
									disabled={testingProfile[profileName] || savingProfile[profileName] || loading || saving || !hasUrl}
								>
									{#snippet children()}
										<RefreshCw class={`h-4 w-4 mr-2 ${testingProfile[profileName] ? 'animate-spin' : ''}`} />
										{testingProfile[profileName] ? $t('settings.proxy.testing') : $t('settings.proxy.testProfile')}
									{/snippet}
								</Button>

								{#if testResult}
									<span class="text-xs {testResult.success ? 'text-green-600' : 'text-red-600'}">
										{#if testResult.success}
											{$t('settings.proxy.verified')}
										{:else}
											{$t('settings.proxy.failed')}
										{/if}
									</span>
								{:else}
									<span class="text-xs text-muted-foreground">{$t('settings.proxy.testRequiredBeforeSave')}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="pt-2">
				<p class="text-xs text-muted-foreground">
					{$t('settings.proxy.globalTestHint')}
				</p>
				{#if globalProxyTestResult}
					<p class="text-xs mt-1 {globalProxyTestResult.success ? 'text-green-600' : 'text-red-600'}">
						{#if globalProxyTestResult.success}
							{$t('settings.proxy.globalVerified')}
						{:else}
							{$t('settings.proxy.globalTestFailed')}
						{/if}
					</p>
				{/if}
			</div>

			{#if globalProxyTestResult && !globalProxyTestResult.success}
				<p class="text-xs text-red-600 mt-2">
					{$t('settings.proxy.fixAndTestAgain')}
				</p>
			{/if}
		</fieldset>
	</SettingsSubsection>

	<SettingsSubsection title={$t('settings.flaresolverr.title')}>
		<FormToggle
			label={$t('settings.flaresolverr.enable')}
			description={$t('settings.flaresolverr.enableDesc')}
			checked={config.scrapers?.flaresolverr?.enabled ?? false}
			onchange={(val) => {
				if (!config.scrapers.flaresolverr) config.scrapers.flaresolverr = {} as FlareSolverrConfigType;
				config.scrapers.flaresolverr.enabled = val;
				invalidateGlobalFlareSolverrTest();
			}}
		/>

		<fieldset disabled={!flaresolverrEnabled} class={`space-y-0 ${!flaresolverrEnabled ? 'opacity-60' : ''}`}>
			<FormTextInput
				label={$t('settings.flaresolverr.url')}
				description={$t('settings.flaresolverr.urlDesc')}
				value={config.scrapers?.flaresolverr?.url ?? 'http://localhost:8191/v1'}
				placeholder="http://localhost:8191/v1"
				onchange={(val) => {
					if (!config.scrapers.flaresolverr) config.scrapers.flaresolverr = {} as FlareSolverrConfigType;
					config.scrapers.flaresolverr.url = val;
					invalidateGlobalFlareSolverrTest();
				}}
			/>

			<FormNumberInput
				label={$t('settings.flaresolverr.timeout')}
				description={$t('settings.flaresolverr.timeoutDesc')}
				value={config.scrapers?.flaresolverr?.timeout ?? 30}
				min={5}
				max={300}
				unit="seconds"
				onchange={(val) => {
					if (!config.scrapers.flaresolverr) config.scrapers.flaresolverr = {} as FlareSolverrConfigType;
					config.scrapers.flaresolverr.timeout = val;
					invalidateGlobalFlareSolverrTest();
				}}
			/>

			<FormNumberInput
				label={$t('settings.flaresolverr.maxRetries')}
				description={$t('settings.flaresolverr.maxRetriesDesc')}
				value={config.scrapers?.flaresolverr?.max_retries ?? 3}
				min={0}
				max={10}
				onchange={(val) => {
					if (!config.scrapers.flaresolverr) config.scrapers.flaresolverr = {} as FlareSolverrConfigType;
					config.scrapers.flaresolverr.max_retries = val;
					invalidateGlobalFlareSolverrTest();
				}}
			/>

			<FormNumberInput
				label={$t('settings.flaresolverr.sessionTtl')}
				description={$t('settings.flaresolverr.sessionTtlDesc')}
				value={config.scrapers?.flaresolverr?.session_ttl ?? 300}
				min={60}
				max={3600}
				unit="seconds"
				onchange={(val) => {
					if (!config.scrapers.flaresolverr) config.scrapers.flaresolverr = {} as FlareSolverrConfigType;
					config.scrapers.flaresolverr.session_ttl = val;
					invalidateGlobalFlareSolverrTest();
				}}
			/>

			<div class="pt-2 flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onclick={() => runProxyTest('flaresolverr')}
					disabled={testingFlareSolverr || loading || saving}
				>
					{#snippet children()}
						<RefreshCw class={`h-4 w-4 mr-2 ${testingFlareSolverr ? 'animate-spin' : ''}`} />
						{testingFlareSolverr ? $t('settings.flaresolverr.testing') : $t('settings.flaresolverr.testFlareSolverr')}
					{/snippet}
				</Button>

				{#if globalFlareSolverrTestResult}
					<span class="text-xs {globalFlareSolverrTestResult.success ? 'text-green-600' : 'text-red-600'}">
						{#if globalFlareSolverrTestResult.success}
							{$t('settings.flaresolverr.working')}
						{:else}
							{$t('settings.flaresolverr.testFailed')}
						{/if}
					</span>
				{/if}
			</div>

			{#if globalFlareSolverrTestResult && !globalFlareSolverrTestResult.success}
				<p class="text-xs text-red-600 mt-2">
					{$t('settings.flaresolverr.fixAndRetry')}
				</p>
			{/if}
		</fieldset>
	</SettingsSubsection>
</SettingsSection>