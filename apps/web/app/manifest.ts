import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OrzuChat — мессенджер со сквозным шифрованием',
    short_name: 'OrzuChat',
    description:
      'Приватный мессенджер со сквозным шифрованием: чаты, комнаты и зашифрованные аудио- и видеозвонки.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0A1120',
    theme_color: '#1B7BFF',
    lang: 'ru',
    dir: 'ltr',
    categories: ['communication', 'social', 'productivity'],
    id: SITE.url,
    icons: [
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
