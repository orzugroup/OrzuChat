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
    <section className="relative overflow-hidden pb-16 pt-8 sm:pb-20 sm:pt-10 lg:pb-28 lg:pt-12">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src="/images/group-friends-park.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.18] saturate-125 dark:opacity-[0.22]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-mist/70 via-mist/92 to-mist dark:from-navy/70 dark:via-navy/92 dark:to-navy" />
        <div className="glow-brand absolute inset-x-0 -top-24 h-[40rem] opacity-80" />
      </div>

      <div className="container-page relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <p className="eyebrow">
              <LockIcon className="h-3.5 w-3.5" />
              {hero.badge}
            </p>

            <h1 className="h1 mt-6 text-ink dark:text-white">{hero.h1}</h1>
            <p className="lead mt-6 max-w-xl">{hero.sub}</p>

            <div className="mt-9 flex flex-wrap items-start gap-3">
              <ApkButton dict={dict} size="lg" />
              <PlayStoreButton dict={dict} size="lg" />
              <AppStoreButton dict={dict} size="lg" />
            </div>

            <p className="mt-5 text-sm font-semibold text-ink dark:text-white">{hero.note}</p>
            <p className="mt-1 text-sm text-ink-muted dark:text-navy-muted">{hero.apkHint}</p>

            <Link
              href={pathFor(locale, 'security')}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue-deep dark:text-brand-cyan"
            >
              {hero.secondary}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>

            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-line pt-8 dark:border-navy-line">
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

          <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
            <div className="relative col-span-2 overflow-hidden rounded-[2rem] border border-white/40 shadow-[0_40px_90px_-40px_rgba(10,17,32,0.75)] dark:border-white/10">
              <Image
                src="/images/friends-cafe-chat.png"
                alt={hero.imageAlt}
                width={1600}
                height={1200}
                priority
                sizes="(min-width: 1024px) 560px, 100vw"
                className="aspect-[4/3] h-full w-full object-cover"
              />
            </div>
            <div className="overflow-hidden rounded-[1.6rem] border border-white/40 dark:border-white/10">
              <Image
                src="/images/friends-video-call.png"
                alt=""
                width={1200}
                height={900}
                sizes="280px"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="overflow-hidden rounded-[1.6rem] border border-white/40 dark:border-white/10">
              <Image
                src="/images/couple-night-chat.png"
                alt=""
                width={900}
                height={1200}
                sizes="280px"
                className="aspect-[3/4] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
