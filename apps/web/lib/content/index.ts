import type { Locale } from '@/lib/i18n';
import type { Dict } from './types';
import { en } from './en';
import { ru } from './ru';

const DICTS: Record<Locale, Dict> = { ru, en };

export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}

export type { Dict };
export * from './types';
