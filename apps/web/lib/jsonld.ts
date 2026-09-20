import type { Dict, QA } from '@/lib/content';
import type { Locale, RouteKey } from '@/lib/i18n';
import { pathFor } from '@/lib/i18n';
import { ORZUX } from '@/lib/links';
import { SITE, absoluteUrl } from '@/lib/site';

const ORG_ID = `${SITE.url}/#organization`;
const SITE_ID = `${SITE.url}/#website`;
const APP_ID = `${SITE.url}/#app`;

export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: ORZUX.name,
    alternateName: 'OrzuX — AI solutions for business',
    url: ORZUX.url,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/orzux-icon.png'),
      width: 512,
      height: 512,
    },
    sameAs: [ORZUX.url, SITE.url],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@orzuchat.com',
        availableLanguage: ['ru', 'en'],
      },
    ],
  };
}

export function websiteJsonLd(locale: Locale): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: SITE.name,
    url: SITE.url,
    inLanguage: locale === 'ru' ? 'ru-RU' : 'en-US',
    publisher: { '@id': ORG_ID },
  };
}

export function softwareApplicationJsonLd(dict: Dict): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': APP_ID,
    name: SITE.name,
    applicationCategory: 'CommunicationApplication',
    applicationSubCategory: 'Messaging',
    operatingSystem: 'Android',
    url: SITE.url,
    downloadUrl: absoluteUrl(pathFor(dict.locale, 'download')),
    inLanguage: SITE.appLanguages.map((lang) => lang.code),
    description: dict.home.meta.description,
    image: absoluteUrl('/images/hero-phone-chat.png'),
    screenshot: [
      absoluteUrl('/images/hero-phone-chat.png'),
      absoluteUrl('/images/video-call.png'),
      absoluteUrl('/images/rooms-group-call.png'),
      absoluteUrl('/images/app-showcase-phones.png'),
    ],
    featureList: dict.home.features.items.map((item) => item.title),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
  };
}

export function faqJsonLd(items: QA[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export function webPageJsonLd({
  locale,
  route,
  name,
  description,
}: {
  locale: Locale;
  route: RouteKey;
  name: string;
  description: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: absoluteUrl(pathFor(locale, route)),
    inLanguage: locale === 'ru' ? 'ru-RU' : 'en-US',
    isPartOf: { '@id': SITE_ID },
    about: { '@id': APP_ID },
    publisher: { '@id': ORG_ID },
  };
}

export function breadcrumbJsonLd(
  locale: Locale,
  trail: { name: string; route: RouteKey }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(pathFor(locale, item.route)),
    })),
  };
}
