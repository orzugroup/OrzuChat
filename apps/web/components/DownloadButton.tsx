import { DOWNLOAD } from '@/lib/links';
import type { Dict } from '@/lib/content';
import { AppleIcon, DownloadIcon, GooglePlayIcon } from './Icons';

type Size = 'md' | 'lg';

const SIZE: Record<Size, string> = {
  md: '',
  lg: 'px-7 py-4 text-base sm:text-[1.0625rem]',
};

/** Buttons placed on the always-dark bands need fixed light-on-dark colours. */
const ON_DARK_SECONDARY =
  'inline-flex items-center justify-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold tracking-tight text-white transition duration-200 ease-out hover:border-white/40 hover:bg-white/15 sm:text-base';
const ON_DARK_PENDING =
  'inline-flex cursor-default items-center justify-center gap-2.5 rounded-full border border-dashed border-brand-cyan/40 bg-brand-cyan/10 px-6 py-3.5 text-sm font-semibold tracking-tight text-brand-cyan sm:text-base';

type ButtonProps = {
  dict: Dict;
  size?: Size;
  /** Set on sections with a permanently dark background. */
  onDark?: boolean;
};

/**
 * Primary call to action. Renders a real link once `DOWNLOAD.googlePlay` is
 * filled in, and an explicit "coming soon" state while it is empty. The
 * pending state stays in the accessibility tree — it is a disabled button with
 * an explanatory description rather than a hidden element.
 */
export function PlayStoreButton({ dict, size = 'md', onDark = false }: ButtonProps) {
  const href = DOWNLOAD.googlePlay.trim();

  if (!href) {
    return (
      <span className="inline-flex flex-col items-start gap-1.5">
        <button
          type="button"
          disabled
          aria-disabled="true"
          aria-describedby="play-pending-note"
          className={`${onDark ? ON_DARK_PENDING : 'btn-pending'} ${SIZE[size]}`}
        >
          <GooglePlayIcon className="h-[18px] w-[18px]" />
          {dict.common.comingSoonPlay}
        </button>
        <span id="play-pending-note" className="sr-only">
          {dict.common.notPublishedYet}
        </span>
      </span>
    );
  }

  return (
    <a href={href} className={`btn-primary ${SIZE[size]}`} rel="noopener">
      <GooglePlayIcon className="h-[18px] w-[18px]" />
      {dict.common.getOnPlay}
    </a>
  );
}

/** App Store CTA. Same empty-link behaviour as the Play button. */
export function AppStoreButton({ dict, size = 'md', onDark = false }: ButtonProps) {
  const href = DOWNLOAD.appStore.trim();

  if (!href) {
    return (
      <span className="inline-flex flex-col items-start gap-1.5">
        <button
          type="button"
          disabled
          aria-disabled="true"
          aria-describedby="app-pending-note"
          className={`${onDark ? ON_DARK_PENDING : 'btn-pending'} ${SIZE[size]}`}
        >
          <AppleIcon className="h-[18px] w-[18px]" />
          {dict.common.comingSoonApp}
        </button>
        <span id="app-pending-note" className="sr-only">
          {dict.common.notPublishedYet}
        </span>
      </span>
    );
  }

  return (
    <a href={href} className={`btn-primary ${SIZE[size]}`} rel="noopener">
      <AppleIcon className="h-[18px] w-[18px]" />
      {dict.common.getOnAppStore}
    </a>
  );
}

/** Direct APK download — same empty-link behaviour as the Play button. */
export function ApkButton({ dict, size = 'md', onDark = false }: ButtonProps) {
  const href = DOWNLOAD.apk.trim();

  if (!href) {
    return (
      <span className="inline-flex flex-col items-start gap-1.5">
        <button
          type="button"
          disabled
          aria-disabled="true"
          aria-describedby="apk-pending-note"
          className={`${onDark ? ON_DARK_PENDING : 'btn-pending'} ${SIZE[size]}`}
        >
          <DownloadIcon className="h-[18px] w-[18px]" />
          {dict.common.apkComingSoon}
        </button>
        <span id="apk-pending-note" className="sr-only">
          {dict.common.notPublishedYet}
        </span>
      </span>
    );
  }

  return (
    <a
      href={href}
      download
      className={`${onDark ? ON_DARK_SECONDARY : 'btn-secondary'} ${SIZE[size]}`}
      rel="noopener"
    >
      <DownloadIcon className="h-[18px] w-[18px]" />
      {dict.common.downloadApk}
    </a>
  );
}

/** Compact header CTA: links to the store when live, otherwise to /download. */
export function HeaderDownloadCta({ dict, href }: { dict: Dict; href: string }) {
  const play = DOWNLOAD.googlePlay.trim();

  if (play) {
    return (
      <a href={play} className="btn-primary px-5 py-2.5 text-sm" rel="noopener">
        <GooglePlayIcon className="h-4 w-4" />
        {dict.common.getOnPlay}
      </a>
    );
  }

  return (
    <a href={href} className="btn-primary px-5 py-2.5 text-sm">
      <DownloadIcon className="h-4 w-4" />
      {dict.nav.download}
    </a>
  );
}
