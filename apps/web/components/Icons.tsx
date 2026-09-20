import type { ReactElement, SVGProps } from 'react';
import type { FeatureIcon } from '@/lib/content/types';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export function LockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="10" width="16" height="10" rx="3" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
      <path d="M12 14v2.5" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="7" width="12" height="10" rx="3" />
      <path d="m15 11 5-3v8l-5-3z" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3.2 3.2 0 0 1 0 6" />
      <path d="M17.5 14.2A5.5 5.5 0 0 1 20.5 19" />
    </svg>
  );
}

export function MediaIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="13" rx="3" />
      <path d="m3 14 4-3.5 3.5 3L15 9l6 5" />
      <circle cx="9" cy="8.5" r="1.4" />
      <path d="M7 21h10" />
    </svg>
  );
}

export function PaletteIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-1.4-1-1.9-1-3 0-.9.7-1.6 1.7-1.6H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3Z" />
      <circle cx="7.8" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7.6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="8.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.2 5 6v5.4c0 4.2 2.8 7.6 7 9.4 4.2-1.8 7-5.2 7-9.4V6l-7-2.8Z" />
      <path d="m9.2 12.2 2 2 3.6-3.8" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="m4 20 16-16" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="m5 12.5 4.2 4.2L19 7" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12h15" />
      <path d="m13.5 6 6 6-6 6" />
    </svg>
  );
}

export function AndroidIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...props}>
      <path d="M6.2 9.6h11.6v7.2a1.4 1.4 0 0 1-1.4 1.4H7.6a1.4 1.4 0 0 1-1.4-1.4V9.6Zm-2.1.2a1.15 1.15 0 0 1 2.3 0v4.8a1.15 1.15 0 0 1-2.3 0V9.8Zm13.4 0a1.15 1.15 0 0 1 2.3 0v4.8a1.15 1.15 0 0 1-2.3 0V9.8ZM8.6 18.9h1.9v2.05a1.15 1.15 0 0 1-2.3 0V18.9h.4Zm4.9 0h1.9v2.05a1.15 1.15 0 0 1-2.3 0V18.9h.4ZM8.9 4.2l-.9-1.5a.3.3 0 0 1 .52-.3l.92 1.55a6.9 6.9 0 0 1 5.12 0l.92-1.55a.3.3 0 0 1 .52.3l-.9 1.5A5.4 5.4 0 0 1 17.8 8.6H6.2a5.4 5.4 0 0 1 2.7-4.4ZM9.3 6.9a.62.62 0 1 0 0-1.24.62.62 0 0 0 0 1.24Zm5.4 0a.62.62 0 1 0 0-1.24.62.62 0 0 0 0 1.24Z" />
    </svg>
  );
}

export function GooglePlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...props}>
      <path d="M3.6 2.4a1.3 1.3 0 0 0-.5 1.05v17.1c0 .43.19.8.5 1.05l9.05-9.6L3.6 2.4Zm10.2 8.05 2.94-3.12-9.9-5.55a1.3 1.3 0 0 0-1.02-.12l7.98 8.79Zm0 3.1-7.98 8.79c.33.08.69.04 1.02-.12l9.9-5.55-2.94-3.12Zm6.63-2.72-2.6-1.46-3.2 3.4 3.2 3.4 2.6-1.46c1.02-.57 1.02-2.31 0-2.88Z" />
    </svg>
  );
}

export function AppleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...props}>
      <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.5-.15-2.85.85-3.6.85-.74 0-1.86-.83-3.06-.81-1.57.02-3.02.91-3.83 2.31-1.63 2.83-.42 7.01 1.17 9.3.78 1.12 1.7 2.38 2.91 2.33 1.17-.05 1.61-.75 3.02-.75 1.41 0 1.81.75 3.05.73 1.26-.02 2.06-1.14 2.83-2.27.89-1.3 1.26-2.56 1.28-2.63-.03-.01-2.45-.94-2.47-3.76ZM14.1 5.9c.65-.79 1.09-1.88.97-2.97-.94.04-2.07.62-2.74 1.41-.6.7-1.13 1.82-.99 2.89 1.05.08 2.11-.53 2.76-1.33Z" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4v10" />
      <path d="m7.5 10 4.5 4.5 4.5-4.5" />
      <path d="M4.5 19h15" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 8 8 5 8-5" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M21 3 10.5 13.5" />
      <path d="M21 3l-6.8 18-3.7-7.5L3 9.8 21 3Z" />
    </svg>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8" />
      <path d="m16 7 2.2 2.2" />
      <path d="m19 4 2 2" />
    </svg>
  );
}

const FEATURE_ICONS: Record<FeatureIcon, (props: IconProps) => ReactElement> = {
  lock: LockIcon,
  phone: PhoneIcon,
  users: UsersIcon,
  media: MediaIcon,
  palette: PaletteIcon,
  globe: GlobeIcon,
  shield: ShieldIcon,
  eye: EyeIcon,
};

export function FeatureGlyph({ name, className }: { name: FeatureIcon; className?: string }) {
  const Glyph = FEATURE_ICONS[name];
  return <Glyph className={className} />;
}
