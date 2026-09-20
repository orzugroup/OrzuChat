import Image from 'next/image';
import type { Dict } from '@/lib/content';

export function PeopleStrip({ dict }: { dict: Dict }) {
  return (
    <section aria-label={dict.nav.people} className="pb-4 pt-2">
      <div className="container-page">
        <ul className="grid gap-3 sm:grid-cols-3">
          {dict.home.people.map((item) => (
            <li
              key={item.src}
              className="relative min-h-[14rem] overflow-hidden rounded-[1.75rem] border border-line shadow-[0_20px_50px_-32px_rgba(10,17,32,0.55)] dark:border-navy-line sm:min-h-[16rem]"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
