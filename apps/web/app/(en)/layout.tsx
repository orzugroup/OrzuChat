import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { ThemeScript } from '@/components/ThemeScript';
import { getDict } from '@/lib/content';
import { alternatesFor } from '@/lib/i18n';
import { buildMetadata } from '@/lib/metadata';
import { SITE } from '@/lib/site';
import '../globals.css';

const dict = getDict('en');

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  ...buildMetadata({ locale: 'en', route: 'home', meta: dict.home.meta }),
  applicationName: SITE.name,
  authors: [{ name: 'OrzuX', url: 'https://www.orzux.com' }],
  creator: 'OrzuX',
  publisher: 'OrzuX',
  category: 'technology',
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: false, address: false, email: false },
  alternates: alternatesFor('en', 'home'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F7FB' },
    { media: '(prefers-color-scheme: dark)', color: '#0A1120' },
  ],
  colorScheme: 'light dark',
};

export default function EnglishRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
