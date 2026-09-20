import Image from 'next/image';
import type { Dict } from '@/lib/content';
import { ApkButton, AppStoreButton, PlayStoreButton } from '../DownloadButton';

export function CtaBand({ dict }: { dict: Dict }) {
  const cta = dict.home.cta;

  return (
    <section id="download" className="section pt-0">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-5xl bg-navy px-7 py-14 sm:px-12 sm:py-16 lg:px-16">
          <Image
            src="/images/friends-city-evening.png"
            alt=""
            aria-hidden
            width={1600}
            height={900}
            sizes="100vw"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy via-navy/88 to-navy/35"
          />

          <div className="relative max-w-2xl">
            <h2 className="h2 text-white">{cta.h2}</h2>
            <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">{cta.text}</p>

            <div className="mt-9 flex flex-wrap items-start gap-4">
              <ApkButton dict={dict} size="lg" onDark />
              <PlayStoreButton dict={dict} size="lg" onDark />
              <AppStoreButton dict={dict} size="lg" onDark />
            </div>

            <p className="mt-6 text-sm text-white/60">{cta.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
