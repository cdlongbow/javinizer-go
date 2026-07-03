import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import {
	addMessages,
	init,
	getLocaleFromNavigator,
	locale as svelteLocale,
	_
} from 'svelte-i18n';

import en from './locales/en.json';
import zh from './locales/zh.json';

addMessages('en', en);
addMessages('zh', zh);

export const supportedLocales = ['en', 'zh'] as const;
export type Locale = (typeof supportedLocales)[number];

export const locale = writable<Locale>('en');

export function isLocale(v: unknown): v is Locale {
	return typeof v === 'string' && supportedLocales.includes(v as Locale);
}

export function getInitialLocale(): Locale {
	if (!browser) return 'en';
	const stored = localStorage.getItem('javinizer_locale');
	if (stored && isLocale(stored)) return stored;
	const nav = getLocaleFromNavigator();
	if (nav) {
		const base = nav.split('-')[0].toLowerCase();
		if (isLocale(base)) return base;
	}
	return 'en';
}

export function setLocale(loc: Locale) {
	locale.set(loc);
	svelteLocale.set(loc);
	if (browser) {
		localStorage.setItem('javinizer_locale', loc);
	}
}

export function initI18n() {
	const initial = getInitialLocale();
	locale.set(initial);
	init({
		fallbackLocale: 'en',
		initialLocale: initial,
	});
	if (!browser) return;
	svelteLocale.set(initial);
}

export { _ as t } from 'svelte-i18n';
