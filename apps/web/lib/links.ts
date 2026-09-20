/**
 * Every outbound download link for OrzuChat lives here.
 *
 * Leave a value as an empty string until the link is live — the download
 * buttons automatically render a non-clickable "coming soon" state for empty
 * values and turn into real links as soon as a URL is pasted in.
 */
export const DOWNLOAD = {
  /** Google Play listing, e.g. 'https://play.google.com/store/apps/details?id=com.orzux.orzuchat'. */
  googlePlay: '', // TODO: add Play Store URL when published
  /** Direct .apk download, e.g. 'https://orzuchat.com/downloads/orzuchat-latest.apk'. */
  apk: '', // TODO: add direct APK URL
  /** Apple App Store listing — iOS is planned, not released. */
  appStore: '',
} as const;

export type DownloadChannel = keyof typeof DOWNLOAD;

/** A channel is "live" only when someone has filled in its URL. */
export function isAvailable(channel: DownloadChannel): boolean {
  return DOWNLOAD[channel].trim().length > 0;
}

/** True when at least one download channel is live. */
export function hasAnyDownload(): boolean {
  return (Object.keys(DOWNLOAD) as DownloadChannel[]).some(isAvailable);
}

export const CONTACT = {
  email: 'support@orzuchat.com',
  privacyEmail: 'privacy@orzuchat.com',
  telegram: 'https://t.me/orzux',
} as const;

export const ORZUX = {
  name: 'OrzuX',
  url: 'https://www.orzux.com',
} as const;
