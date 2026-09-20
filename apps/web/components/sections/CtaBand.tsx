import Image from 'next/image';
import type { Dict } from '@/lib/content';
import { ApkButton, PlayStoreButton } from '../DownloadButton';

export function CtaBand({ dict }: { dict: Dict }) {
  const cta = dict.home.cta;

  return (
    <section id="download" className="section pt-0">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-5xl bg-navy px-7 py-14 sm:px-12 sm:py-16 lg:px-16">
          <Image
            src="/images/network-connection.png"
            alt=""
            aria-hidden
            width={1280}
            height={720}
            sizes="100vw"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/40"
          />

          <div className="relative max-w-2xl">
            <h2 className="h2 text-white">{cta.h2}</h2>
            <p className="mt-4 text-base leading-relaxed text-navy-muted sm:text-lg">{cta.text}</p>

            <div className="mt-9 flex flex-wrap items-start gap-4">
              <PlayStoreButton dict={dict} size="lg" onDark />
              <ApkButton dict={dict} size="lg" onDark />
            </div>

            <p className="mt-6 text-sm text-navy-muted">{cta.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
