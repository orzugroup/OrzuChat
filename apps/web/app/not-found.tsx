import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeScript } from '@/components/ThemeScript';
import { getDict } from '@/lib/content';
import { SITE } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: '404 — OrzuChat',
  robots: { index: false, follow: true },
};

/**
 * The app uses one root layout per language group, so the catch-all 404 has no
 * layout of its own and has to render the document shell itself.
 */
export default function NotFound() {
  const ru = getDict('ru');
  const en = getDict('en');

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen antialiased">
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24">
          <div
            aria-hidden
            className="glow-brand pointer-events-none absolute inset-x-0 -top-40 h-[32rem] opacity-70"
          />
          <div className="relative max-w-lg text-center">
            <p className="text-7xl font-bold tracking-tight gradient-text sm:text-8xl">404</p>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-ink sm:text-3xl dark:text-white">
              {ru.notFound.title}
            </h1>
            <p className="mt-3 text-base text-ink-muted dark:text-navy-muted">{ru.notFound.text}</p>
            <p className="mt-6 text-sm text-ink-muted dark:text-navy-muted" lang="en">
              {en.notFound.text}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/" className="btn-primary">
                {ru.notFound.cta}
              </Link>
              <Link href="/en" className="btn-secondary" hrefLang="en" lang="en">
                {en.notFound.cta}
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
