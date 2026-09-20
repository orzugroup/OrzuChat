export type Locale = 'ru' | 'en';

export const LOCALES: readonly Locale[] = ['ru', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'ru';

export type RouteKey = 'home' | 'security' | 'download' | 'support' | 'privacy' | 'terms';

/** Path of every route relative to its locale root. */
export const ROUTES: Record<RouteKey, string> = {
  home: '',
  security: '/security',
  download: '/download',
  support: '/support',
  privacy: '/privacy',
  terms: '/terms',
};

export const ROUTE_KEYS = Object.keys(ROUTES) as RouteKey[];

/** Russian lives at the root, English under /en. */
export function localePrefix(locale: Locale): string {
  return locale === 'en' ? '/en' : '';
}

export function pathFor(locale: Locale, route: RouteKey): string {
  return `${localePrefix(locale)}${ROUTES[route]}` || '/';
}

/** Same page in the other language — used by the language switcher. */
export function switchLocalePath(current: Locale, route: RouteKey): string {
  return pathFor(current === 'ru' ? 'en' : 'ru', route);
}

/** `alternates` block for the Next.js Metadata API, including x-default. */
export function alternatesFor(locale: Locale, route: RouteKey) {
  return {
    canonical: pathFor(locale, route),
    languages: {
      ru: pathFor('ru', route),
      en: pathFor('en', route),
      'x-default': pathFor('ru', route),
    },
  };
}

export const HTML_LANG: Record<Locale, string> = { ru: 'ru', en: 'en' };
export const OG_LOCALE: Record<Locale, string> = { ru: 'ru_RU', en: 'en_US' };
