import type { Article, Dict } from '@/lib/content';
import type { Locale, RouteKey } from '@/lib/i18n';
import { breadcrumbJsonLd, webPageJsonLd } from '@/lib/jsonld';
import { JsonLd } from '../JsonLd';
import { PageHero } from '../PageHero';
import { PageShell } from '../PageShell';

export function LegalPage({
  dict,
  locale,
  route,
  article,
}: {
  dict: Dict;
  locale: Locale;
  route: RouteKey;
  article: Article;
}) {
  return (
    <PageShell dict={dict} locale={locale} route={route}>
      <JsonLd
        data={[
          webPageJsonLd({
            locale,
            route,
            name: article.h1,
            description: article.meta.description,
          }),
          breadcrumbJsonLd(locale, [
            { name: 'OrzuChat', route: 'home' },
            { name: article.h1, route },
          ]),
        ]}
      />

      <PageHero
        title={article.h1}
        intro={article.intro}
        meta={`${dict.common.updated}: ${article.updated}`}
      />

      <div className="container-page pb-20">
        <article className="max-w-3xl">
          {article.sections.map((section) => (
            <section key={section.h2} className="mt-12 first:mt-8">
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
      </div>
    </PageShell>
  );
}
