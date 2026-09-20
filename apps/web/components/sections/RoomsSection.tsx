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
            <Image
              src="/images/rooms-group-call.png"
              alt={rooms.imageAlt}
              width={1152}
              height={864}
              sizes="(min-width: 1024px) 560px, 100vw"
              className="w-full rounded-[2rem] border border-line shadow-[0_30px_70px_-40px_rgba(11,18,32,0.6)] dark:border-navy-line"
            />
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
