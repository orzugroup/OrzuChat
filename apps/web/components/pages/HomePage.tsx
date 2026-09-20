import type { Dict } from '@/lib/content';
import type { Locale } from '@/lib/i18n';
import {
  faqJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from '@/lib/jsonld';
import { JsonLd } from '../JsonLd';
import { PageShell } from '../PageShell';
import { CtaBand } from '../sections/CtaBand';
import { Faq } from '../sections/Faq';
import { Features } from '../sections/Features';
import { Hero } from '../sections/Hero';
import { LanguagesSection } from '../sections/LanguagesSection';
import { RoomsSection } from '../sections/RoomsSection';
import { SecuritySection } from '../sections/SecuritySection';
import { Showcase } from '../sections/Showcase';
import { TrustStrip } from '../sections/TrustStrip';

export function HomePage({ dict, locale }: { dict: Dict; locale: Locale }) {
  return (
    <PageShell dict={dict} locale={locale} route="home">
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd(locale),
          softwareApplicationJsonLd(dict),
          faqJsonLd(dict.home.faq.items),
        ]}
      />
      <Hero dict={dict} locale={locale} />
      <TrustStrip dict={dict} />
      <Features dict={dict} />
      <SecuritySection dict={dict} locale={locale} />
      <RoomsSection dict={dict} />
      <LanguagesSection dict={dict} />
      <Showcase dict={dict} />
      <Faq title={dict.home.faq.h2} subtitle={dict.home.faq.sub} items={dict.home.faq.items} />
      <CtaBand dict={dict} />
    </PageShell>
  );
}
