import Link from 'next/link';
import type { Locale, RouteKey } from '@/lib/i18n';
import { pathFor } from '@/lib/i18n';
import { GlobeIcon } from './Icons';

const SHORT: Record<Locale, string> = { ru: 'RU', en: 'EN' };

export function LanguageSwitch({
  locale,
  route,
  label,
  className = '',
}: {
  locale: Locale;
  route: RouteKey;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-line bg-white p-1 dark:border-navy-line dark:bg-navy-alt/60 ${className}`}
      role="group"
      aria-label={label}
    >
      <GlobeIcon className="ml-1.5 h-4 w-4 shrink-0 text-ink-muted dark:text-navy-muted" />
      {(['ru', 'en'] as Locale[]).map((code) => {
        const active = code === locale;
        return (
          <Link
            key={code}
            href={pathFor(code, route)}
            hrefLang={code}
            lang={code}
            aria-current={active ? 'true' : undefined}
            className={
              active
                ? 'rounded-full bg-brand-blue px-2.5 py-1 text-xs font-bold text-white'
                : 'rounded-full px-2.5 py-1 text-xs font-semibold text-ink-muted transition hover:text-brand-blue-deep dark:text-navy-muted dark:hover:text-brand-cyan'
            }
          >
            {SHORT[code]}
          </Link>
        );
      })}
    </div>
  );
}
