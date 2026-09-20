# OrzuChat — marketing website

The public website for **OrzuChat**, the private end-to-end encrypted messenger by
[OrzuX](https://www.orzux.com). Built with Next.js 15 (App Router), TypeScript and Tailwind CSS v4.

This app is **standalone**. It is not part of any npm workspace and it does not import anything from
`apps/mobile` or `apps/api` — install and build it from inside `apps/web`.

```bash
cd apps/web
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm start       # serve the production build
```

---

## Adding the download links

**Everything lives in one file: [`lib/links.ts`](./lib/links.ts).**

```ts
export const DOWNLOAD = {
  googlePlay: '', // TODO: add Play Store URL when published
  apk: '',        // TODO: add direct APK URL
  appStore: '',
};
```

Behaviour is automatic:

| Value                             | What the site renders                                                           |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `googlePlay: ''` (empty)          | A disabled "Скоро в Google Play" / "Coming soon to Google Play" button            |
| `googlePlay: 'https://play...'`   | A real, clickable "Скачать в Google Play" / "Get it on Google Play" link          |
| `apk: ''` (empty)                 | A disabled "APK скоро" / "APK coming soon" button                                 |
| `apk: 'https://.../orzuchat.apk'` | A real download link                                                              |

So when the app goes live, the only change needed is:

```ts
googlePlay: 'https://play.google.com/store/apps/details?id=com.orzux.orzuchat',
apk: 'https://orzuchat.com/downloads/orzuchat-latest.apk',
```

Commit, push, and Vercel redeploys with working buttons. No other file needs to be touched.

The disabled state is still accessible: it is a real `<button disabled>` with an
`aria-describedby` note explaining that the app is not published yet, so screen readers announce it
properly instead of the button silently disappearing.

Support addresses and the OrzuX link live in the same file (`CONTACT`, `ORZUX`).

---

## Routes

Russian is the primary language and lives at the root. English is a full mirror under `/en`.

| Russian     | English        | Page                         |
| ----------- | -------------- | ---------------------------- |
| `/`         | `/en`          | Home                         |
| `/security` | `/en/security` | How the encryption works     |
| `/download` | `/en/download` | Download / install           |
| `/support`  | `/en/support`  | Support and contact          |
| `/privacy`  | `/en/privacy`  | Privacy policy               |
| `/terms`    | `/en/terms`    | Terms of service             |

Generated routes: `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/icon.png`,
`/apple-icon.png`, `/opengraph-image`, `/twitter-image`, `/en/opengraph-image`, `/en/twitter-image`.

### How the two languages are wired

`app/(ru)` and `app/(en)` are two route groups, each with its own root layout, so the document can
carry the correct `<html lang="…">`. Route keys, paths and `hreflang` alternates are generated from
a single source of truth in [`lib/i18n.ts`](./lib/i18n.ts) — adding a page means adding one entry to
`ROUTES` and the sitemap plus the language switcher pick it up automatically.

All copy lives in [`lib/content/ru.ts`](./lib/content/ru.ts) and
[`lib/content/en.ts`](./lib/content/en.ts), typed against
[`lib/content/types.ts`](./lib/content/types.ts) so the two languages cannot drift apart.

---

## SEO

- Per-page `metadata` with unique `title`, `description`, `keywords`, `openGraph`, `twitter`,
  `alternates.canonical` and `alternates.languages` (including `x-default`).
- `metadataBase` is `https://orzuchat.com` — change it in [`lib/site.ts`](./lib/site.ts) if the
  domain ever changes; everything else derives from it.
- `app/sitemap.ts` emits all 12 URLs with per-URL `hreflang` alternates.
- `app/robots.ts` allows all crawlers and points at the sitemap.
- JSON-LD: `Organization`, `WebSite`, `SoftwareApplication` (category
  `CommunicationApplication`, OS `Android`, price 0), `FAQPage`, `WebPage` and `BreadcrumbList` —
  see [`lib/jsonld.ts`](./lib/jsonld.ts).
- Social cards are generated at build time with `next/og` (`app/(ru)/opengraph-image.tsx`,
  `app/(en)/en/opengraph-image.tsx` and their `twitter-image` counterparts). The card art is
  wordmark-led and Latin-only because the default Satori font set has no Cyrillic coverage.
- One `<h1>` per page, ordered headings, `<nav>` / `<main>` / `<footer>` landmarks, a skip link, and
  descriptive `alt` text on every meaningful image (decorative art uses empty `alt` on purpose).

---

## Theming

Brand colours and the blue → cyan → mint gradient are defined once in `app/globals.css` under
`@theme`. Dark mode follows `prefers-color-scheme` on first visit and can then be toggled in the
header; the choice is stored in `localStorage` and applied before first paint by a small inline
script, so there is no flash of the wrong theme.

---

## Images

Original artwork lives in `public/images/` and is rendered through `next/image` with explicit
`width`/`height`. Only the hero image uses `priority`.

| File                              | Used on                            |
| --------------------------------- | ---------------------------------- |
| `hero-phone-chat.png`             | Home hero, showcase                |
| `security-shield.png`             | Home security band, `/security`    |
| `video-call.png`                  | Showcase                           |
| `rooms-group-call.png`            | Rooms section                      |
| `media-voice-messages.png`        | Showcase                           |
| `privacy-shield-phone.png`        | Showcase                           |
| `app-showcase-phones.png`         | Languages & themes, `/download`    |
| `network-connection.png`          | Download CTA band background       |
| `people-communicating.png`        | `/support`                         |

`public/orzuchat-logo.png`, `public/orzux-icon.png` and `public/orzux-icon-dark.png` are copies of
the app's brand assets from `apps/mobile/assets/images/`.

---

## Deploying to Vercel

The project needs no environment variables, no database and no build configuration.

### Option A — Vercel CLI

```bash
npm i -g vercel
cd apps/web
vercel login
vercel link          # create or link the project
vercel --prod        # build and deploy to production
```

### Option B — Git integration (recommended)

1. Push the repository to GitHub/GitLab/Bitbucket.
2. In the Vercel dashboard choose **Add New → Project** and import the repo.
3. Set **Root Directory** to `apps/web`. This is the only setting that matters in this monorepo.
4. Framework preset is detected as **Next.js**; leave build command (`next build`), output directory
   and install command at their defaults.
5. Deploy.

### Domain

Add `orzuchat.com` (and `www.orzuchat.com` redirecting to it) under **Project → Settings → Domains**.
The canonical URLs, sitemap and social cards already point at `https://orzuchat.com`.

---

## Verification

```bash
cd apps/web
npm install
npm run build      # must finish with zero errors and zero warnings
npx tsc --noEmit   # must print nothing
```
