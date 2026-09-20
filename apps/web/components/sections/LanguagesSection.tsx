import Image from 'next/image';
import type { Dict } from '@/lib/content';
import { SITE } from '@/lib/site';

export function LanguagesSection({ dict }: { dict: Dict }) {
  const block = dict.home.languages;

  return (
    <section id="languages" className="section pt-0">
      <div className="container-page">
        <div className="card overflow-hidden">
          <div className="grid gap-10 p-8 sm:p-10 lg:grid-cols-2 lg:items-center lg:gap-12 lg:p-14">
            <div>
              <h2 className="h2 text-ink dark:text-white">{block.h2}</h2>
              <p className="lead mt-4">{block.sub}</p>

              <ul className="mt-8 flex flex-wrap gap-2.5">
                {SITE.appLanguages.map((lang) => (
                  <li key={lang.code}>
                    <span
                      lang={lang.code}
                      className="inline-flex rounded-full border border-line bg-mist px-3.5 py-1.5 text-sm font-medium text-ink dark:border-navy-line dark:bg-navy-alt/60 dark:text-slate-200"
                    >
                      {lang.label}
                    </span>
                  </li>
                ))}
              </ul>

              <h3 className="mt-10 text-base font-semibold tracking-tight text-ink dark:text-white">
                {block.themesTitle}
              </h3>
              <p className="mt-2 prose-body">{block.themesText}</p>
            </div>

            <div className="relative">
              <div
                aria-hidden
                className="brand-gradient absolute inset-6 -z-10 rounded-[3rem] opacity-20 blur-3xl"
              />
              <Image
                src="/images/app-showcase-phones.png"
                alt={block.imageAlt}
                width={1280}
                height={720}
                sizes="(min-width: 1024px) 560px, 100vw"
                className="w-full rounded-[1.5rem] border border-line dark:border-navy-line"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
