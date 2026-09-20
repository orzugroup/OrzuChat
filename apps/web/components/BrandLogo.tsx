import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import { pathFor } from '@/lib/i18n';

export function BrandLogo({
  locale,
  className = '',
  label = 'OrzuChat',
}: {
  locale: Locale;
  className?: string;
  label?: string;
}) {
  return (
    <Link
      href={pathFor(locale, 'home')}
      className={`group inline-flex items-center gap-2.5 rounded-xl ${className}`}
      aria-label={`${label} — ${locale === 'ru' ? 'на главную' : 'home'}`}
    >
      <Image
        src="/orzuchat-logo.png"
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 rounded-[11px] shadow-[0_6px_18px_-8px_rgba(27,123,255,0.9)] transition-transform duration-300 group-hover:scale-105"
      />
      <span className="text-[1.0625rem] font-bold tracking-tight text-ink dark:text-white">
        Orzu<span className="gradient-text">Chat</span>
      </span>
    </Link>
  );
}
