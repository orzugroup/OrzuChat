import 'react-native-url-polyfill/auto';

import { createClient, type SupportedStorage } from '@supabase/supabase-js';

import { encryptedSessionStorage } from '@/lib/crypto/sessionStorage';
import { supabaseAnonKey, supabaseConfigured, supabaseUrl } from '@/lib/env';

export { supabaseConfigured };

const memoryStorage: SupportedStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
};

const canUseNativeStorage = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl || 'http://localhost', supabaseAnonKey || 'anon', {
  auth: {
    storage: canUseNativeStorage ? encryptedSessionStorage : memoryStorage,
    autoRefreshToken: canUseNativeStorage,
    persistSession: canUseNativeStorage,
    detectSessionInUrl: false,
  },
});
