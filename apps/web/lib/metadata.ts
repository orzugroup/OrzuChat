import type { Metadata } from 'next';
import type { Meta } from '@/lib/content';
import type { Locale, RouteKey } from '@/lib/i18n';
import { OG_LOCALE, alternatesFor, pathFor } from '@/lib/i18n';
import { SITE } from '@/lib/site';

/**
 * Social images come from the file conventions in `app/opengraph-image.tsx`
 * and `app/twitter-image.tsx`, so they are deliberately not set here — Next.js
 * would otherwise emit two competing `og:image` tags per page.
 */
export function buildMetadata({
  locale,
  route,
  meta,
}: {
  locale: Locale;
  route: RouteKey;
  meta: Meta;
}): Metadata {
  const url = pathFor(locale, route);
  const title = meta.ogTitle ?? meta.title;
  const description = meta.ogDescription ?? meta.description;

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: alternatesFor(locale, route),
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      locale: OG_LOCALE[locale],
      alternateLocale: locale === 'ru' ? OG_LOCALE.en : OG_LOCALE.ru,
      url,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE.twitter,
      creator: SITE.twitter,
      title,
      description,
    },
  };
}
