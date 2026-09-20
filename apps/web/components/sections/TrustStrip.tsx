import type { Dict } from '@/lib/content';
import { CheckIcon } from '../Icons';

export function TrustStrip({ dict }: { dict: Dict }) {
  return (
    <section aria-label={dict.home.trust.map((item) => item.title).join(', ')} className="pb-6">
      <div className="container-page">
        <ul className="grid gap-px overflow-hidden rounded-4xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4 dark:border-navy-line dark:bg-navy-line">
          {dict.home.trust.map((item) => (
            <li key={item.title} className="bg-white p-6 dark:bg-navy-card">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-mint/12 text-brand-mint">
                  <CheckIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink dark:text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted dark:text-navy-muted">
                    {item.text}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
