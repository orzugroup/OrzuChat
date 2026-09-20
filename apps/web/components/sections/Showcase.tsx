import Image from 'next/image';
import type { Dict } from '@/lib/content';
import { SectionHeading } from '../SectionHeading';

export function Showcase({ dict }: { dict: Dict }) {
  const showcase = dict.home.showcase;

  return (
    <section id="screenshots" className="section pt-0">
      <div className="container-page">
        <SectionHeading title={showcase.h2} subtitle={showcase.sub} />

        <ul className="mt-14 grid gap-6 sm:grid-cols-2">
          {showcase.items.map((item) => (
            <li key={item.src} className="card-interactive overflow-hidden">
              <div className="bg-navy">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={1152}
                  height={864}
                  sizes="(min-width: 640px) 45vw, 100vw"
                  className="h-auto w-full"
                />
              </div>
              <div className="p-6">
                <h3 className="text-base font-semibold tracking-tight text-ink dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-navy-muted">
                  {item.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
