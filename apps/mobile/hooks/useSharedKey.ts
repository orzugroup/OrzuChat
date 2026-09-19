import { useEffect, useState } from 'react';

import { sharedKeyWith } from '@/lib/crypto/e2e';

export type SharedKeyState = {
  key: Uint8Array | null;
  /** true once the lookup finished (key may still be null if the peer has no published key). */
  resolved: boolean;
};

/** Resolves the E2E shared key with `peerId` (null while loading or when unavailable). */
export function useSharedKey(peerId: string | null | undefined): SharedKeyState {
  const [state, setState] = useState<SharedKeyState>({ key: null, resolved: false });

  useEffect(() => {
    if (!peerId) {
      setState({ key: null, resolved: false });
      return;
    }
    let cancelled = false;
    setState({ key: null, resolved: false });
    sharedKeyWith(peerId)
      .then((key) => {
        if (!cancelled) setState({ key, resolved: true });
      })
      .catch(() => {
        if (!cancelled) setState({ key: null, resolved: true });
      });
    return () => {
      cancelled = true;
    };
  }, [peerId]);

  return state;
}
