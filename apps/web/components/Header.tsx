'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Dict } from '@/lib/content';
import type { Locale, RouteKey } from '@/lib/i18n';
import { pathFor } from '@/lib/i18n';
import { BrandLogo } from './BrandLogo';
import { HeaderDownloadCta } from './DownloadButton';
import { CloseIcon, MenuIcon } from './Icons';
import { LanguageSwitch } from './LanguageSwitch';
import { ThemeToggle } from './ThemeToggle';

export function Header({ dict, locale, route }: { dict: Dict; locale: Locale; route: RouteKey }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const home = pathFor(locale, 'home');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const links: { href: string; label: string }[] = [
    { href: `${home === '/' ? '' : home}/#life`, label: dict.nav.people },
    { href: `${home === '/' ? '' : home}/#features`, label: dict.nav.features },
    { href: pathFor(locale, 'security'), label: dict.nav.security },
    { href: `${home === '/' ? '' : home}/#rooms`, label: dict.nav.rooms },
    { href: `${home === '/' ? '' : home}/#faq`, label: dict.nav.faq },
    { href: pathFor(locale, 'support'), label: dict.nav.support },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-line bg-white/85 backdrop-blur-xl dark:border-navy-line dark:bg-navy/85'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-18">
        <BrandLogo locale={locale} />

        <nav aria-label={dict.common.menu} className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-muted transition hover:bg-brand-blue/8 hover:text-brand-blue-deep dark:text-navy-muted dark:hover:bg-brand-cyan/10 dark:hover:text-brand-cyan"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <LanguageSwitch locale={locale} route={route} label={dict.common.languageLabel} />
          <ThemeToggle label={dict.common.themeLabel} />
          <HeaderDownloadCta dict={dict} href={pathFor(locale, 'download')} />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle label={dict.common.themeLabel} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? dict.common.close : dict.common.menu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:border-brand-blue/40 dark:border-navy-line dark:bg-navy-alt/60 dark:text-white"
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-menu"
          className="border-t border-line bg-white/95 backdrop-blur-xl lg:hidden dark:border-navy-line dark:bg-navy/95"
        >
          <nav aria-label={dict.common.menu} className="container-page flex flex-col gap-1 py-5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-base font-medium text-ink transition hover:bg-brand-blue/8 dark:text-white dark:hover:bg-brand-cyan/10"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <LanguageSwitch locale={locale} route={route} label={dict.common.languageLabel} />
              <HeaderDownloadCta dict={dict} href={pathFor(locale, 'download')} />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
