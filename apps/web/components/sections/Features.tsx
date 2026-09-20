import type { Dict } from '@/lib/content';
import { FeatureGlyph } from '../Icons';
import { SectionHeading } from '../SectionHeading';

export function Features({ dict }: { dict: Dict }) {
  const { h2, sub, items } = dict.home.features;

  return (
    <section id="features" className="section">
      <div className="container-page">
        <SectionHeading title={h2} subtitle={sub} />

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.title} className="card-interactive p-6">
              <span className="brand-gradient inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_-12px_rgba(13,87,232,0.9)]">
                <FeatureGlyph name={item.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-base font-semibold tracking-tight text-ink dark:text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-navy-muted">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
