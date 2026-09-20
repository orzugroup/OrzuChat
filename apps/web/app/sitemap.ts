import type { MetadataRoute } from 'next';
import { LOCALES, ROUTE_KEYS, pathFor } from '@/lib/i18n';
import type { Locale, RouteKey } from '@/lib/i18n';
import { absoluteUrl } from '@/lib/site';

const PRIORITY: Record<RouteKey, number> = {
  home: 1,
  download: 0.9,
  security: 0.8,
  support: 0.6,
  privacy: 0.5,
  terms: 0.5,
};

const CHANGE_FREQUENCY: Record<RouteKey, MetadataRoute.Sitemap[number]['changeFrequency']> = {
  home: 'weekly',
  download: 'weekly',
  security: 'monthly',
  support: 'monthly',
  privacy: 'yearly',
  terms: 'yearly',
};

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return LOCALES.flatMap((locale: Locale) =>
    ROUTE_KEYS.map((route) => ({
      url: absoluteUrl(pathFor(locale, route)),
      lastModified,
      changeFrequency: CHANGE_FREQUENCY[route],
      priority: PRIORITY[route],
      alternates: {
        languages: {
          ru: absoluteUrl(pathFor('ru', route)),
          en: absoluteUrl(pathFor('en', route)),
          'x-default': absoluteUrl(pathFor('ru', route)),
        },
      },
    })),
  );
}
