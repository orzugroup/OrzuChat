import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { PublicProfile } from '@/lib/types';

export type PublicProfileState = {
  profile: PublicProfile | null;
  loading: boolean;
  error: string | null;
};

/** Loads another user's profile through the privacy-aware `get_public_profile` RPC. */
export function usePublicProfile(userId: string | null | undefined): PublicProfileState {
  const [state, setState] = useState<PublicProfileState>({ profile: null, loading: Boolean(userId), error: null });

  useEffect(() => {
    if (!userId) {
      setState({ profile: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ profile: null, loading: true, error: null });
    supabase
      .rpc('get_public_profile', { target_id: userId })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ profile: null, loading: false, error: error.message });
          return;
        }
        const row = Array.isArray(data) ? data[0] : data;
        setState({ profile: (row as PublicProfile | undefined) ?? null, loading: false, error: null });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return state;
}

export function displayNameOf(profile: PublicProfile | null, fallback = 'Пользователь'): string {
  return profile?.display_name || profile?.username || fallback;
}
