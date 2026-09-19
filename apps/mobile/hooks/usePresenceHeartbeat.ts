import { useEffect } from 'react';
import { AppState } from 'react-native';

import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

export function usePresenceHeartbeat() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    const beat = () => {
      if (cancelled || AppState.currentState !== 'active') return;
      void api.heartbeat().catch(() => undefined);
    };

    beat();
    const interval = setInterval(beat, 20000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') beat();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      sub.remove();
    };
  }, [session]);
}
