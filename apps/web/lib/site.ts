export const SITE = {
  name: 'OrzuChat',
  domain: 'orzuchat.com',
  url: 'https://orzuchat.com',
  twitter: '@orzux',
  /** Interface languages shipped in the app, in the order shown on the site. */
  appLanguages: [
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
    { code: 'tg', label: 'Тоҷикӣ' },
    { code: 'uz', label: "O'zbekcha" },
    { code: 'kk', label: 'Қазақша' },
    { code: 'ky', label: 'Кыргызча' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'az', label: 'Azərbaycanca' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
  ],
} as const;

export const BRAND = {
  blue: '#1B7BFF',
  blueDeep: '#0D57E8',
  cyan: '#12C2F7',
  mint: '#00D69A',
  dark: '#0A1120',
  light: '#F4F7FB',
  ink: '#0B1220',
} as const;

export function absoluteUrl(path: string): string {
  return `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`;
}
