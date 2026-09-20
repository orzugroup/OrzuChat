import Image from 'next/image';
import Link from 'next/link';
import type { Dict } from '@/lib/content';
import type { Locale } from '@/lib/i18n';
import { pathFor } from '@/lib/i18n';
import { ArrowRightIcon, KeyIcon, LockIcon, ShieldIcon } from '../Icons';

const STEP_ICONS = [KeyIcon, LockIcon, ShieldIcon];

export function SecuritySection({ dict, locale }: { dict: Dict; locale: Locale }) {
  const security = dict.home.security;

  return (
    <section id="security" className="section relative overflow-hidden bg-navy text-white">
      <div aria-hidden className="glow-brand pointer-events-none absolute inset-0 opacity-90" />
      <div
        aria-hidden
        className="grid-lines pointer-events-none absolute inset-0 text-white/40 fade-edges"
      />

      <div className="container-page relative">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="eyebrow border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan">
              <ShieldIcon className="h-3.5 w-3.5" />
              E2E
            </p>
            <h2 className="h2 mt-6 text-white">{security.h2}</h2>
            <p className="mt-4 text-base leading-relaxed text-navy-muted sm:text-lg">{security.sub}</p>

            <div className="mt-7 space-y-4">
              {security.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-[15px] leading-7 text-slate-300/90">
                  {paragraph}
                </p>
              ))}
            </div>

            <Link
              href={pathFor(locale, 'security')}
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-cyan transition hover:gap-3"
            >
              {security.cta}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="brand-gradient absolute inset-8 -z-10 rounded-full opacity-25 blur-3xl"
            />
            <Image
              src="/images/security-shield.png"
              alt={security.imageAlt}
              width={1152}
              height={864}
              sizes="(min-width: 1024px) 560px, 100vw"
              className="w-full rounded-[2rem] border border-white/10 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]"
            />
          </div>
        </div>

        <ol className="mt-16 grid gap-5 md:grid-cols-3">
          {security.steps.map((step, index) => {
            const Glyph = STEP_ICONS[index] ?? LockIcon;
            return (
              <li
                key={step.title}
                className="rounded-4xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition duration-300 hover:border-brand-cyan/35 hover:bg-white/[0.07]"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan">
                  <Glyph className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-semibold tracking-tight text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-muted">{step.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
