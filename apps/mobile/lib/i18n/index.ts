import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import { az } from './locales/az';
import { de } from './locales/de';
import { en, type TranslationKey, type Translations } from './locales/en';
import { es } from './locales/es';
import { kk } from './locales/kk';
import { ky } from './locales/ky';
import { ru } from './locales/ru';
import { tg } from './locales/tg';
import { tr } from './locales/tr';
import { uz } from './locales/uz';

export type Locale = 'en' | 'ru' | 'tg' | 'uz' | 'kk' | 'ky' | 'tr' | 'az' | 'de' | 'es';

/** `null` = follow the phone language. */
export type LocalePreference = Locale | null;

export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'ru', 'tg', 'uz', 'kk', 'ky', 'tr', 'az', 'de', 'es'];

const TABLES: Record<Locale, Translations> = { en, ru, tg, uz, kk, ky, tr, az, de, es };

const STORAGE_KEY = 'orzuchat.locale';

/** Native names shown in the language picker. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  tg: 'Тоҷикӣ',
  uz: "O'zbekcha",
  kk: 'Қазақша',
  ky: 'Кыргызча',
  tr: 'Türkçe',
  az: 'Azərbaycanca',
  de: 'Deutsch',
  es: 'Español',
};

function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value) && (SUPPORTED_LOCALES as readonly string[]).includes(value as string);
}

/**
 * Picks the app language from the phone settings: the first preferred device
 * language we support wins, otherwise English.
 */
function detectLocale(): Locale {
  try {
    for (const entry of getLocales()) {
      const code = entry.languageCode?.toLowerCase();
      if (isLocale(code)) return code;
    }
  } catch {
    // web / test environments without the native module
  }
  return 'en';
}

const deviceLocale: Locale = detectLocale();

let preference: LocalePreference = null;
let active: Locale = deviceLocale;

const listeners = new Set<() => void>();

function notify() {
  for (const listener of [...listeners]) listener();
}

/** Language currently used by `t()`. */
export function currentLocale(): Locale {
  return active;
}

/** User choice, or `null` while the app follows the phone language. */
export function localePreference(): LocalePreference {
  return preference;
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Applies the stored language choice; call once before the first render. */
export async function restoreLocale(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!isLocale(stored)) return;
    preference = stored;
    active = stored;
    notify();
  } catch {
    // keep the device language
  }
}

/** Switches the app language; `null` goes back to the phone language. */
export function setLocale(next: LocalePreference): void {
  preference = next;
  active = next ?? deviceLocale;
  notify();
  void AsyncStorage.setItem(STORAGE_KEY, next ?? '').catch(() => undefined);
}

/** BCP-47 tag for Intl formatting (dates, numbers). */
export const localeTag: string = (() => {
  try {
    return getLocales()[0]?.languageTag ?? deviceLocale;
  } catch {
    return deviceLocale;
  }
})();

/** Device region (ISO 3166-1 alpha-2) — used to pre-select the phone country code. */
export const deviceRegion: string | null = (() => {
  try {
    return getLocales()[0]?.regionCode ?? null;
  } catch {
    return null;
  }
})();

type Params = Record<string, string | number>;

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name];
    return value === undefined ? `{${name}}` : String(value);
  });
}

/** Translate a key in the active language (falls back to English). */
export function t(key: TranslationKey, params?: Params): string {
  const table = TABLES[active];
  const template = table[key] ?? en[key] ?? key;
  return interpolate(template, params);
}

export type { TranslationKey };
