import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api } from '@/lib/api';
import { errorMessage, showAlert } from '@/lib/alert';
import { t } from '@/lib/i18n';
import { clearCallNotifications, isTestIncomingCall, type PushData } from '@/lib/notifications';
import { realtimeChannel, supabase } from '@/lib/supabase';
import type { Call, CallKind, CallSession } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';

type CallContextValue = {
  incoming: Call | null;
  active: CallSession | null;
  startCall: (calleeId: string, kind: CallKind, conversationId?: string) => Promise<void>;
  acceptIncoming: () => Promise<void>;
  rejectIncoming: () => Promise<void>;
  hangup: () => Promise<void>;
  /** Push tap / shade: show the full-screen incoming UI (WhatsApp-style). */
  openIncomingFromPush: (data: PushData, action: 'open' | 'accept' | 'decline') => Promise<void>;
};

const CallContext = createContext<CallContextValue | null>(null);

function callErrorMessage(error: unknown): string {
  const raw = errorMessage(error, t('common.error'));
  if (/CLEARTEXT/i.test(raw)) return t('call.cleartext');
  if (raw === 'busy') return t('call.busy');
  if (raw === 'already_in_call') return t('call.alreadyInCall');
  if (raw === 'callee not found') return t('call.calleeNotFound');
  return raw;
}

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

    const channel = realtimeChannel(`calls:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, (payload) => {
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
          void clearCallNotifications(call.id);
        }

        if (call.status === 'accepted') {
          setIncoming((current) => (current?.id === call.id ? null : current));
          void clearCallNotifications(call.id);
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const startCall = useCallback(async (calleeId: string, kind: CallKind, conversationId?: string) => {
    try {
      const sessionPayload = await api.startCall(calleeId, kind, conversationId);
      setActive(sessionPayload);
      router.push({ pathname: '/(app)/call/[id]', params: { id: sessionPayload.call.id } });
    } catch (error) {
      showAlert(t('call.failedTitle'), callErrorMessage(error));
    }
  }, []);

  const acceptIncoming = useCallback(async () => {
    if (!incoming) return;
    if (isTestIncomingCall(incoming.id, incoming.caller_id)) {
      void clearCallNotifications(incoming.id);
      setIncoming(null);
      return;
    }
    try {
      const sessionPayload = await api.acceptCall(incoming.id);
      setIncoming(null);
      setActive(sessionPayload);
      void clearCallNotifications(incoming.id);
      router.push({ pathname: '/(app)/call/[id]', params: { id: sessionPayload.call.id } });
    } catch (error) {
      showAlert(t('call.answerFailed'), callErrorMessage(error));
    }
  }, [incoming]);

  const rejectIncoming = useCallback(async () => {
    if (!incoming) return;
    if (isTestIncomingCall(incoming.id, incoming.caller_id)) {
      void clearCallNotifications(incoming.id);
      setIncoming(null);
      return;
    }
    try {
      await api.rejectCall(incoming.id);
    } catch {
      // already ended on the other side
    } finally {
      void clearCallNotifications(incoming.id);
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

  const openIncomingFromPush = useCallback(async (data: PushData, action: 'open' | 'accept' | 'decline') => {
    const callId = data.call_id;
    if (!callId) return;
    const preview: Call = {
      id: callId,
      conversation_id: null,
      caller_id: data.caller_id || 'script',
      callee_id: userId ?? '',
      kind: data.kind === 'audio' ? 'audio' : 'video',
      status: 'ringing',
      room_name: '',
      started_at: null,
      ended_at: null,
      created_at: new Date().toISOString(),
    };

    if (action === 'decline') {
      if (!isTestIncomingCall(callId, data.caller_id)) {
        await api.rejectCall(callId).catch(() => undefined);
      }
      void clearCallNotifications(callId);
      setIncoming(null);
      return;
    }

    if (action === 'accept') {
      void clearCallNotifications(callId);
      if (isTestIncomingCall(callId, data.caller_id)) {
        setIncoming(null);
        return;
      }
      try {
        const sessionPayload = await api.acceptCall(callId);
        setIncoming(null);
        setActive(sessionPayload);
        router.push({ pathname: '/(app)/call/[id]', params: { id: sessionPayload.call.id } });
      } catch (error) {
        setIncoming(preview);
        showAlert(t('call.answerFailed'), callErrorMessage(error));
      }
      return;
    }

    setIncoming(preview);
    if (isTestIncomingCall(callId, data.caller_id)) return;

    try {
      const { call } = await api.getCall(callId);
      if (call.status !== 'ringing') {
        void clearCallNotifications(callId);
        setIncoming((current) => (current?.id === callId ? null : current));
        return;
      }
      setIncoming(call);
    } catch {
      // Keep the overlay from the push payload so Answer/Decline stay on screen.
    }
  }, [userId]);

  useEffect(() => {
    const fromUrl = (url: string | null) => {
      if (!url || !url.includes('incoming')) return;
      const parsed = Linking.parse(url);
      const query = parsed.queryParams ?? {};
      const callId = String(query.call_id ?? '');
      if (!callId) return;
      void openIncomingFromPush(
        {
          type: 'incoming_call',
          call_id: callId,
          kind: query.kind === 'audio' ? 'audio' : 'video',
          caller_id: query.caller_id ? String(query.caller_id) : undefined,
        },
        query.action === 'decline' ? 'decline' : query.action === 'accept' ? 'accept' : 'open',
      );
    };
    void Linking.getInitialURL().then(fromUrl);
    const sub = Linking.addEventListener('url', (event) => fromUrl(event.url));
    return () => sub.remove();
  }, [openIncomingFromPush]);

  const value = useMemo(
    () => ({ incoming, active, startCall, acceptIncoming, rejectIncoming, hangup, openIncomingFromPush }),
    [acceptIncoming, active, hangup, incoming, openIncomingFromPush, rejectIncoming, startCall],
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
