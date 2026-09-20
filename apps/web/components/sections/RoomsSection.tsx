import Image from 'next/image';
import type { Dict } from '@/lib/content';
import { CheckIcon } from '../Icons';

export function RoomsSection({ dict }: { dict: Dict }) {
  const rooms = dict.home.rooms;

  return (
    <section id="rooms" className="section">
      <div className="container-page">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            <div
              aria-hidden
              className="brand-gradient absolute inset-10 -z-10 rounded-[3rem] opacity-20 blur-3xl"
            />
            <div className="overflow-hidden rounded-[2rem] border border-line shadow-[0_30px_70px_-40px_rgba(11,18,32,0.6)] dark:border-navy-line">
              <Image
                src="/images/group-friends-park.png"
                alt={rooms.imageAlt}
                width={1400}
                height={900}
                sizes="(min-width: 1024px) 560px, 100vw"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-2 hidden w-[46%] overflow-hidden rounded-[1.4rem] border border-white/70 shadow-2xl sm:block dark:border-white/10">
              <Image
                src="/images/rooms-group-call.png"
                alt=""
                width={800}
                height={600}
                sizes="240px"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="h2 text-ink dark:text-white">{rooms.h2}</h2>
            <p className="lead mt-4">{rooms.sub}</p>

            <div className="mt-6 space-y-4">
              {rooms.paragraphs.map((paragraph) => (
                <p key={paragraph} className="prose-body">
                  {paragraph}
                </p>
              ))}
            </div>

            <ul className="mt-8 space-y-3">
              {rooms.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue-deep dark:bg-brand-cyan/12 dark:text-brand-cyan">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[15px] leading-7 text-ink dark:text-slate-200">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
