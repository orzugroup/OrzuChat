import type { ReactNode } from 'react';
import type { Dict } from '@/lib/content';
import type { Locale, RouteKey } from '@/lib/i18n';
import { Footer } from './Footer';
import { Header } from './Header';

export function PageShell({
  dict,
  locale,
  route,
  children,
}: {
  dict: Dict;
  locale: Locale;
  route: RouteKey;
  children: ReactNode;
}) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-brand-blue focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        {dict.common.skipToContent}
      </a>
      <Header dict={dict} locale={locale} route={route} />
      <main id="main">{children}</main>
      <Footer dict={dict} locale={locale} route={route} />
    </>
  );
}
