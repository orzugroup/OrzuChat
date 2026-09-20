import Image from 'next/image';
import type { Dict } from '@/lib/content';
import type { Locale } from '@/lib/i18n';
import { breadcrumbJsonLd, faqJsonLd, webPageJsonLd } from '@/lib/jsonld';
import { CONTACT } from '@/lib/links';
import { MailIcon, SendIcon } from '../Icons';
import { JsonLd } from '../JsonLd';
import { PageHero } from '../PageHero';
import { PageShell } from '../PageShell';
import { Faq } from '../sections/Faq';

export function SupportPageView({ dict, locale }: { dict: Dict; locale: Locale }) {
  const page = dict.support;

  return (
    <PageShell dict={dict} locale={locale} route="support">
      <JsonLd
        data={[
          webPageJsonLd({
            locale,
            route: 'support',
            name: page.h1,
            description: page.meta.description,
          }),
          breadcrumbJsonLd(locale, [
            { name: 'OrzuChat', route: 'home' },
            { name: page.h1, route: 'support' },
          ]),
          faqJsonLd(page.faq),
        ]}
      />

      <PageHero title={page.h1} intro={page.intro} />

      <div className="container-page">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.1fr]">
          <a
            href={`mailto:${CONTACT.email}`}
            className="card-interactive block p-7"
          >
            <span className="brand-gradient inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white">
              <MailIcon className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-lg font-semibold tracking-tight text-ink dark:text-white">
              {page.emailTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-navy-muted">
              {page.emailText}
            </p>
            <p className="mt-4 text-sm font-semibold text-brand-blue-deep dark:text-brand-cyan">
              {CONTACT.email}
            </p>
          </a>

          <a
            href={CONTACT.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="card-interactive block p-7"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-cyan/12 text-brand-cyan">
              <SendIcon className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-lg font-semibold tracking-tight text-ink dark:text-white">
              {page.telegramTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-navy-muted">
              {page.telegramText}
            </p>
            <p className="mt-4 text-sm font-semibold text-brand-blue-deep dark:text-brand-cyan">
              t.me/orzux
            </p>
          </a>

          <div className="card overflow-hidden sm:col-span-2 lg:col-span-1">
            <Image
              src="/images/people-communicating.png"
              alt={
                locale === 'ru'
                  ? 'Три человека с телефонами, соединённые светящимися линиями связи'
                  : 'Three people holding phones, connected by glowing streams of light'
              }
              width={1152}
              height={864}
              sizes="(min-width: 1024px) 420px, 100vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="mt-20">
        <Faq title={page.faqTitle} items={page.faq} id="support-faq" />
      </div>
    </PageShell>
  );
}
