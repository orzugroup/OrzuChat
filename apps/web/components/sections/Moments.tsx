import Image from 'next/image';
import type { Dict } from '@/lib/content';
import { SectionHeading } from '../SectionHeading';

const SPANS = [
  'md:col-span-4 md:row-span-2 min-h-[22rem] md:min-h-[34rem]',
  'md:col-span-2 min-h-[16rem]',
  'md:col-span-2 min-h-[16rem]',
  'md:col-span-3 min-h-[18rem]',
  'md:col-span-3 min-h-[18rem]',
  'md:col-span-6 min-h-[18rem] md:min-h-[22rem]',
];

export function Moments({ dict }: { dict: Dict }) {
  const { h2, sub, items } = dict.home.moments;

  return (
    <section id="life" className="section">
      <div className="container-page">
        <SectionHeading title={h2} subtitle={sub} />

        <div className="mt-14 grid gap-4 md:grid-cols-6">
          {items.map((item, index) => (
            <figure
              key={item.title}
              className={`group relative overflow-hidden rounded-[2rem] border border-line shadow-[0_28px_70px_-40px_rgba(10,17,32,0.7)] dark:border-navy-line ${SPANS[index] ?? 'md:col-span-3 min-h-[18rem]'}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes={index === 0 || index === 5 ? '(min-width: 768px) 70vw, 100vw' : '(min-width: 768px) 40vw, 100vw'}
                className="object-cover transition duration-700 group-hover:scale-[1.045]"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy via-navy/75 to-transparent p-6 pt-24">
                <p className="text-lg font-semibold tracking-tight text-white">{item.title}</p>
                <p className="mt-1 max-w-lg text-sm leading-relaxed text-white/78">{item.text}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
