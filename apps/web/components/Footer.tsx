import Image from 'next/image';
import Link from 'next/link';
import type { Dict } from '@/lib/content';
import type { Locale, RouteKey } from '@/lib/i18n';
import { pathFor } from '@/lib/i18n';
import { CONTACT, ORZUX } from '@/lib/links';
import { SITE } from '@/lib/site';
import { BrandLogo } from './BrandLogo';
import { LanguageSwitch } from './LanguageSwitch';

export function Footer({ dict, locale, route }: { dict: Dict; locale: Locale; route: RouteKey }) {
  const home = pathFor(locale, 'home');
  const anchor = (hash: string) => `${home === '/' ? '' : home}/#${hash}`;

  const product: { href: string; label: string }[] = [
    { href: anchor('life'), label: dict.nav.people },
    { href: anchor('features'), label: dict.nav.features },
    { href: anchor('rooms'), label: dict.nav.rooms },
    { href: pathFor(locale, 'security'), label: dict.nav.security },
    { href: pathFor(locale, 'download'), label: dict.nav.download },
    { href: anchor('faq'), label: dict.nav.faq },
  ];

  const legal: { href: string; label: string }[] = [
    { href: pathFor(locale, 'privacy'), label: dict.privacy.h1 },
    { href: pathFor(locale, 'terms'), label: dict.terms.h1 },
    { href: pathFor(locale, 'support'), label: dict.support.h1 },
  ];

  return (
    <footer className="mt-24 border-t border-line bg-white dark:border-navy-line dark:bg-navy-surface">
      <div className="container-page py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="max-w-sm">
            <BrandLogo locale={locale} />
            <p className="mt-4 text-sm leading-relaxed text-ink-muted dark:text-navy-muted">
              {dict.footer.tagline}
            </p>
            <p className="mt-5 text-xs font-medium text-ink-muted dark:text-navy-muted">
              {dict.footer.availability}
            </p>
            <div className="mt-6">
              <LanguageSwitch locale={locale} route={route} label={dict.common.languageLabel} />
            </div>
          </div>

          <FooterColumn id="footer-product" title={dict.footer.productTitle} links={product} />
          <FooterColumn id="footer-legal" title={dict.footer.legalTitle} links={legal} />

          <div>
            <h2 className="text-xs font-bold tracking-wider text-ink uppercase dark:text-white">
              {dict.footer.companyTitle}
            </h2>
            <a
              href={ORZUX.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-3 rounded-2xl border border-line p-3 transition hover:border-brand-blue/40 dark:border-navy-line dark:hover:border-brand-cyan/40"
            >
              <Image
                src="/orzux-icon.png"
                alt="Логотип OrzuX"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl dark:hidden"
              />
              <Image
                src="/orzux-icon-dark.png"
                alt=""
                aria-hidden
                width={36}
                height={36}
                className="hidden h-9 w-9 rounded-xl dark:block"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink dark:text-white">{ORZUX.name}</span>
                <span className="block truncate text-xs text-ink-muted dark:text-navy-muted">
                  {dict.footer.orzuxText}
                </span>
              </span>
            </a>
            <a
              href={`mailto:${CONTACT.email}`}
              className="mt-3 inline-block text-sm link-quiet"
            >
              {CONTACT.email}
            </a>

            <h2 className="mt-8 text-xs font-bold tracking-wider text-ink uppercase dark:text-white">
              {dict.footer.languagesTitle}
            </h2>
            <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
              {SITE.appLanguages.map((lang) => (
                <li
                  key={lang.code}
                  lang={lang.code}
                  className="text-xs text-ink-muted dark:text-navy-muted"
                >
                  {lang.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between dark:border-navy-line">
          <p className="text-xs text-ink-muted dark:text-navy-muted">
            © {new Date().getFullYear()} {SITE.name}. {dict.footer.rights}
          </p>
          <p className="text-xs text-ink-muted dark:text-navy-muted">
            {dict.footer.madeBy}{' '}
            <a
              href={ORZUX.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-blue-deep hover:underline dark:text-brand-cyan"
            >
              {ORZUX.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  id,
  title,
  links,
}: {
  id: string;
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-labelledby={id}>
      <h2 id={id} className="text-xs font-bold tracking-wider text-ink uppercase dark:text-white">
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm link-quiet">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
