import Image from 'next/image';
import type { Dict } from '@/lib/content';
import type { Locale } from '@/lib/i18n';
import { breadcrumbJsonLd, softwareApplicationJsonLd, webPageJsonLd } from '@/lib/jsonld';
import { ApkButton, AppStoreButton, PlayStoreButton } from '../DownloadButton';
import { AndroidIcon, AppleIcon, CheckIcon, GooglePlayIcon } from '../Icons';
import { JsonLd } from '../JsonLd';
import { PageHero } from '../PageHero';
import { PageShell } from '../PageShell';

export function DownloadPageView({ dict, locale }: { dict: Dict; locale: Locale }) {
  const page = dict.download;

  return (
    <PageShell dict={dict} locale={locale} route="download">
      <JsonLd
        data={[
          softwareApplicationJsonLd(dict),
          webPageJsonLd({
            locale,
            route: 'download',
            name: page.h1,
            description: page.meta.description,
          }),
          breadcrumbJsonLd(locale, [
            { name: 'OrzuChat', route: 'home' },
            { name: page.h1, route: 'download' },
          ]),
        ]}
      />

      <PageHero title={page.h1} intro={page.intro} />

      <div className="container-page pb-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-brand-blue/20 bg-navy shadow-[0_30px_80px_-40px_rgba(13,87,232,0.55)]">
          <Image
            src="/images/friends-laughing-phones.png"
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className="object-cover opacity-35"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-navy via-navy/88 to-navy/50" />
          <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="eyebrow border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan">
                <AndroidIcon className="h-3.5 w-3.5" />
                {page.apkBadge}
              </p>
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {page.apkTitle}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
                {page.apkText}
              </p>
              <div className="mt-7">
                <ApkButton dict={dict} size="lg" onDark />
              </div>
            </div>
            <div className="relative hidden min-h-[16rem] overflow-hidden rounded-[1.6rem] border border-white/10 lg:block">
              <Image
                src="/images/friends-cafe-chat.png"
                alt={page.imageAlt}
                fill
                sizes="400px"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="card p-7">
            <span className="brand-gradient inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white">
              <GooglePlayIcon className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-lg font-semibold tracking-tight text-ink dark:text-white">
              {page.playTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-navy-muted">
              {page.playText}
            </p>
            <div className="mt-6">
              <PlayStoreButton dict={dict} />
            </div>
          </div>

          <div className="card p-7">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-ink/6 text-ink dark:bg-white/10 dark:text-white">
              <AppleIcon className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-lg font-semibold tracking-tight text-ink dark:text-white">
              {page.iosTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-navy-muted">
              {page.iosText}
            </p>
            <div className="mt-6">
              <AppStoreButton dict={dict} />
            </div>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="h2 text-ink dark:text-white">{page.stepsTitle}</h2>
              <ol className="mt-8 space-y-5">
                {page.steps.map((step) => (
                  <li key={step.title} className="card p-6">
                    <h3 className="text-base font-semibold tracking-tight text-ink dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-navy-muted">
                      {step.text}
                    </p>
                  </li>
                ))}
              </ol>

              <h2 className="mt-12 text-xl font-bold tracking-tight text-ink dark:text-white">
                {page.requirementsTitle}
              </h2>
              <ul className="mt-5 space-y-3">
                {page.requirements.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue-deep dark:bg-brand-cyan/12 dark:text-brand-cyan">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[15px] leading-7 text-ink dark:text-slate-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div
                aria-hidden
                className="brand-gradient absolute inset-8 -z-10 rounded-[3rem] opacity-20 blur-3xl"
              />
              <Image
                src="/images/group-friends-park.png"
                alt={page.imageAlt}
                width={1400}
                height={900}
                sizes="(min-width: 1024px) 560px, 100vw"
                className="w-full rounded-[1.75rem] border border-line object-cover dark:border-navy-line"
              />
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
