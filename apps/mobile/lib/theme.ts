/**
 * OrzuChat design tokens.
 * Palette is derived from the logo: deep blue → cyan → mint gradient on a navy base.
 */
export const colors = {
  bg: '#0A1120',
  surface: '#101A2E',
  surfaceAlt: '#182543',
  card: '#131E36',
  accent: '#1B7BFF',
  accentAlt: '#00D69A',
  accentCyan: '#12C2F7',
  accentMuted: '#123B7A',
  incoming: '#182543',
  outgoing: '#164BA8',
  text: '#EAF1FF',
  muted: '#8A9BBD',
  danger: '#FF5C7A',
  warning: '#FFB454',
  border: '#22314F',
  online: '#00D69A',
} as const;

/** Brand gradient: blue → cyan → mint (same as the logo ring). */
export const gradients = {
  brand: ['#0D57E8', '#12C2F7', '#00D69A'] as const,
  brandSoft: ['#123B7A', '#0F5FB8'] as const,
  banner: ['#0B3C9C', '#0F97E0', '#00C48F'] as const,
  outgoing: ['#1D5FD0', '#164BA8'] as const,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

/** Colors for action icons (attachments, call types) that stay consistent across screens. */
export const actionColors = {
  camera: '#12C2F7',
  photo: '#1B7BFF',
  video: '#7B61FF',
  file: '#FF8A4C',
  audioCall: '#00D69A',
  videoCall: '#7B61FF',
} as const;
