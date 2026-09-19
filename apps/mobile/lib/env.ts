import Constants from 'expo-constants';

type Extra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  apiUrl?: string;
};

function extra(): Extra {
  const fromExpo = Constants.expoConfig?.extra as Extra | undefined;
  const fromManifest = (Constants as { manifest?: { extra?: Extra } }).manifest?.extra;
  return fromExpo ?? fromManifest ?? {};
}

function isUnusable(value: string | undefined, kind: 'url' | 'key' | 'api'): boolean {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return true;
  if (trimmed.includes('YOUR_PROJECT') || trimmed.includes('replace-me')) return true;
  if (kind === 'url' && !trimmed.startsWith('https://')) return true;
  if (kind === 'key' && trimmed.length < 20) return true;
  if (kind === 'api' && (trimmed.includes('localhost') || trimmed.includes('127.0.0.1'))) return true;
  return false;
}

function firstGood(kind: 'url' | 'key' | 'api', ...values: Array<string | undefined>): string {
  for (const value of values) {
    if (!isUnusable(value, kind)) {
      return value!.trim();
    }
  }
  return '';
}

export function getSupabaseUrl(): string {
  const extraValues = extra();
  return firstGood(
    'url',
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    extraValues.supabaseUrl,
    'https://rmvlpxryyxxdjmclqhaa.supabase.co',
  );
}

export function getSupabaseAnonKey(): string {
  const extraValues = extra();
  return firstGood(
    'key',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    extraValues.supabaseAnonKey,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdmxweHJ5eXh4ZGptY2xxaGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTkyNjYsImV4cCI6MjEwNTI5NTI2Nn0.TUlTCRoER8BtiS6v_ZP5cHAF3L6JxxATvMT5HBd1HxY',
  );
}

export function getApiUrl(): string {
  const extraValues = extra();
  return firstGood(
    'api',
    process.env.EXPO_PUBLIC_API_URL,
    extraValues.apiUrl,
    'http://62.238.97.62:8080',
  ).replace(
    /\/$/,
    '',
  );
}

export const supabaseUrl = getSupabaseUrl();
export const supabaseAnonKey = getSupabaseAnonKey();
export const apiUrl = getApiUrl();

export const supabaseConfigured =
  supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20;
