import type { ReactNode } from 'react';

export function PageHero({
  title,
  intro,
  meta,
  children,
}: {
  title: string;
  intro?: string[];
  meta?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pt-14 pb-10 sm:pt-20">
      <div
        aria-hidden
        className="glow-brand pointer-events-none absolute inset-x-0 -top-40 h-[32rem] opacity-60 dark:opacity-90"
      />
      <div className="container-page relative">
        <div className="max-w-3xl">
          {meta ? (
            <p className="mb-5 text-xs font-semibold tracking-wider text-ink-muted uppercase dark:text-navy-muted">
              {meta}
            </p>
          ) : null}
          <h1 className="h1 text-ink dark:text-white">{title}</h1>
          {intro?.length ? (
            <div className="mt-6 space-y-4">
              {intro.map((paragraph) => (
                <p key={paragraph} className="lead">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  );
}
