import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { initE2E, resetE2E } from '@/lib/crypto/e2e';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  /** Privacy setting: block screenshots / screen recording in chats and calls. */
  screenProtection: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const PROFILE_COLUMNS =
  'id, username, display_name, avatar_url, banner_url, phone, last_seen_at, show_username, show_avatar, show_banner, show_phone, show_last_seen, show_read_receipts, block_screen_capture';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const full = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle();
    if (!full.error) {
      setProfile(full.data);
      return;
    }
    const basic = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, phone, last_seen_at')
      .eq('id', userId)
      .maybeSingle();
    if (basic.error) {
      console.warn('profile load failed', basic.error.message);
      return;
    }
    setProfile(basic.data);
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setSession(data.session);
        if (data.session?.user.id) {
          void initE2E(data.session.user.id);
          void loadProfile(data.session.user.id);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user.id) {
        void initE2E(next.user.id);
        void loadProfile(next.user.id);
      } else {
        resetE2E();
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      configured: supabaseConfigured,
      screenProtection: profile?.block_screen_capture ?? true,
      refreshProfile: async () => {
        if (session?.user.id) await loadProfile(session.user.id);
      },
      signOut: async () => {
        await supabase.auth.signOut();
        resetE2E();
        setProfile(null);
      },
    }),
    [loadProfile, loading, profile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
