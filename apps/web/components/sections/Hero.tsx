import Image from 'next/image';
import Link from 'next/link';
import type { Dict } from '@/lib/content';
import type { Locale } from '@/lib/i18n';
import { pathFor } from '@/lib/i18n';
import { ApkButton, AppStoreButton, PlayStoreButton } from '../DownloadButton';
import { ArrowRightIcon, LockIcon } from '../Icons';

export function Hero({ dict, locale }: { dict: Dict; locale: Locale }) {
  const hero = dict.home.hero;

  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 lg:pt-20 lg:pb-24">
      <div
        aria-hidden
        className="glow-brand pointer-events-none absolute inset-x-0 -top-40 h-[42rem] opacity-70 dark:opacity-100"
      />
      <div className="container-page relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          <div>
            <p className="eyebrow">
              <LockIcon className="h-3.5 w-3.5" />
              {hero.badge}
            </p>

            <h1 className="h1 mt-6 text-ink dark:text-white">
              {hero.h1}
            </h1>

            <p className="lead mt-6 max-w-xl">{hero.sub}</p>

            <div className="mt-9 flex flex-wrap items-start gap-4">
              <PlayStoreButton dict={dict} size="lg" />
              <AppStoreButton dict={dict} size="lg" />
              <Link
                href={pathFor(locale, 'security')}
                className="btn-secondary px-7 py-4 text-base sm:text-[1.0625rem]"
              >
                {hero.secondary}
                <ArrowRightIcon className="h-[18px] w-[18px]" />
              </Link>
            </div>

            <p className="mt-5 text-sm font-medium text-ink-muted dark:text-navy-muted">{hero.note}</p>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-8 dark:border-navy-line">
              {hero.stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block text-3xl font-bold tracking-tight gradient-text sm:text-4xl">
                      {stat.value}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-ink-muted sm:text-sm dark:text-navy-muted">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="brand-gradient absolute inset-6 -z-10 rounded-[3rem] opacity-20 blur-3xl"
            />
            <Image
              src="/images/hero-phone-chat.png"
              alt={hero.imageAlt}
              width={1152}
              height={864}
              priority
              sizes="(min-width: 1024px) 560px, 100vw"
              className="w-full rounded-[2rem] border border-navy-line/60 shadow-[0_40px_90px_-40px_rgba(10,17,32,0.7)]"
            />
            <div className="mt-6 flex justify-center lg:hidden">
              <ApkButton dict={dict} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
