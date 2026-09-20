import Image from 'next/image';
import type { Dict } from '@/lib/content';
import type { Locale } from '@/lib/i18n';
import { breadcrumbJsonLd, webPageJsonLd } from '@/lib/jsonld';
import { JsonLd } from '../JsonLd';
import { PageHero } from '../PageHero';
import { PageShell } from '../PageShell';
import { CtaBand } from '../sections/CtaBand';

export function SecurityPageView({ dict, locale }: { dict: Dict; locale: Locale }) {
  const page = dict.securityPage;

  return (
    <PageShell dict={dict} locale={locale} route="security">
      <JsonLd
        data={[
          webPageJsonLd({
            locale,
            route: 'security',
            name: page.h1,
            description: page.meta.description,
          }),
          breadcrumbJsonLd(locale, [
            { name: 'OrzuChat', route: 'home' },
            { name: page.h1, route: 'security' },
          ]),
        ]}
      />

      <PageHero title={page.h1} intro={page.intro} />

      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          <article className="max-w-3xl">
            {page.sections.map((section) => (
              <section key={section.h2} className="mt-12 first:mt-4">
                <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl dark:text-white">
                  {section.h2}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-4 prose-body">
                    {paragraph}
                  </p>
                ))}
                {section.list?.length ? (
                  <ul className="mt-5 space-y-2.5">
                    {section.list.map((item) => (
                      <li key={item} className="flex gap-3 prose-body">
                        <span
                          aria-hidden
                          className="mt-[0.7rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue dark:bg-brand-cyan"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Image
              src="/images/security-shield.png"
              alt={page.imageAlt}
              width={1152}
              height={864}
              sizes="(min-width: 1024px) 420px, 100vw"
              className="w-full rounded-[1.75rem] border border-line dark:border-navy-line"
            />

            <div className="card mt-6 p-6">
              <h2 className="text-sm font-bold tracking-wider text-ink uppercase dark:text-white">
                {page.tableTitle}
              </h2>
              <dl className="mt-4 divide-y divide-line dark:divide-navy-line">
                {page.table.map((row) => (
                  <div key={row.label} className="py-3 first:pt-0 last:pb-0">
                    <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase dark:text-navy-muted">
                      {row.label}
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed text-ink dark:text-slate-200">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      </div>

      <div className="mt-20">
        <CtaBand dict={dict} />
      </div>
    </PageShell>
  );
}
