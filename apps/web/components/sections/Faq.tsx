import type { QA } from '@/lib/content';
import { SectionHeading } from '../SectionHeading';

export function Faq({
  title,
  subtitle,
  items,
  id = 'faq',
}: {
  title: string;
  subtitle?: string;
  items: QA[];
  id?: string;
}) {
  return (
    <section id={id} className="section pt-0">
      <div className="container-page">
        <SectionHeading title={title} subtitle={subtitle} />

        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {items.map((item) => (
            <details
              key={item.q}
              className="group card overflow-hidden px-6 py-1 transition-colors hover:border-brand-blue/30 dark:hover:border-brand-cyan/30"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-[15px] font-semibold tracking-tight text-ink sm:text-base dark:text-white">
                {item.q}
                <span
                  aria-hidden
                  className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-ink-muted transition group-open:rotate-45 group-open:border-brand-blue/40 group-open:text-brand-blue-deep dark:border-navy-line dark:text-navy-muted dark:group-open:border-brand-cyan/40 dark:group-open:text-brand-cyan"
                >
                  <span className="absolute h-[1.5px] w-3 bg-current" />
                  <span className="absolute h-3 w-[1.5px] bg-current" />
                </span>
              </summary>
              <p className="pb-6 text-[15px] leading-7 text-ink-muted dark:text-navy-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
