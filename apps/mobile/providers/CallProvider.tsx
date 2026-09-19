import { router } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Alert } from 'react-native';

import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Call, CallKind, CallSession } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';

type CallContextValue = {
  incoming: Call | null;
  active: CallSession | null;
  startCall: (calleeId: string, kind: CallKind, conversationId?: string) => Promise<void>;
  acceptIncoming: () => Promise<void>;
  rejectIncoming: () => Promise<void>;
  hangup: () => Promise<void>;
};

const CallContext = createContext<CallContextValue | null>(null);

export function CallProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [incoming, setIncoming] = useState<Call | null>(null);
  const [active, setActive] = useState<CallSession | null>(null);

  useEffect(() => {
    if (!userId) {
      setIncoming(null);
      setActive(null);
      return;
    }

    const channel = supabase
      .channel(`calls:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calls' },
        (payload) => {
          const call = payload.new as Call | undefined;
          if (!call?.id) return;
          if (call.caller_id !== userId && call.callee_id !== userId) return;

          if (call.status === 'ringing' && call.callee_id === userId) {
            setIncoming(call);
            return;
          }

          if (['rejected', 'missed', 'ended', 'busy'].includes(call.status)) {
            setIncoming((current) => (current?.id === call.id ? null : current));
            setActive((current) => (current?.call.id === call.id ? null : current));
          }

          if (call.status === 'accepted') {
            setIncoming((current) => (current?.id === call.id ? null : current));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const startCall = useCallback(
    async (calleeId: string, kind: CallKind, conversationId?: string) => {
      try {
        const sessionPayload = await api.startCall(calleeId, kind, conversationId);
        setActive(sessionPayload);
        router.push(`/(app)/call/${sessionPayload.call.id}`);
      } catch (error) {
        Alert.alert('Звонок не удался', error instanceof Error ? error.message : 'Ошибка');
      }
    },
    [],
  );

  const acceptIncoming = useCallback(async () => {
    if (!incoming) return;
    try {
      const sessionPayload = await api.acceptCall(incoming.id);
      setIncoming(null);
      setActive(sessionPayload);
      router.push(`/(app)/call/${sessionPayload.call.id}`);
    } catch (error) {
      Alert.alert('Не удалось ответить', error instanceof Error ? error.message : 'Ошибка');
    }
  }, [incoming]);

  const rejectIncoming = useCallback(async () => {
    if (!incoming) return;
    try {
      await api.rejectCall(incoming.id);
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setIncoming(null);
    }
  }, [incoming]);

  const hangup = useCallback(async () => {
    const id = active?.call.id;
    if (id) {
      try {
        await api.hangupCall(id);
      } catch {
        // already ended
      }
    }
    setActive(null);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [active]);

  const value = useMemo(
    () => ({ incoming, active, startCall, acceptIncoming, rejectIncoming, hangup }),
    [acceptIncoming, active, hangup, incoming, rejectIncoming, startCall],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error('useCall must be used within CallProvider');
  }
  return ctx;
}
