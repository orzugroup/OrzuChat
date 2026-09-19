import { apiUrl } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { CallSession } from '@/lib/types';

async function authHeader(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Нет сессии');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL не задан');
  }
  const headers = await authHeader();
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  let json = {} as T & { error?: string };
  if (text) {
    try {
      json = JSON.parse(text) as T & { error?: string };
    } catch {
      if (!response.ok) {
        throw new Error(text.trim() || `HTTP ${response.status}`);
      }
      throw new Error(text.trim() || 'Пустой ответ сервера');
    }
  }
  if (!response.ok) {
    const message =
      typeof json === 'object' && json && 'error' in json && json.error
        ? String(json.error)
        : text || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return json;
}

export const api = {
  heartbeat: () => request<{ ok: boolean }>('/v1/presence/heartbeat', { method: 'POST' }),
  presence: (userIds: string[]) =>
    request<{ online: Record<string, boolean> }>(`/v1/presence?user_ids=${userIds.join(',')}`),
  registerDevice: (token: string, platform: string) =>
    request<{ ok: boolean }>('/v1/devices', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    }),
  removeDevice: (token: string) =>
    request<{ ok: boolean }>('/v1/devices', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    }),
  startCall: (calleeId: string, kind: 'audio' | 'video', conversationId?: string) =>
    request<CallSession>('/v1/calls', {
      method: 'POST',
      body: JSON.stringify({
        callee_id: calleeId,
        kind,
        conversation_id: conversationId ?? null,
      }),
    }),
  getCall: (id: string) => request<CallSession>(`/v1/calls/${id}`),
  acceptCall: (id: string) => request<CallSession>(`/v1/calls/${id}/accept`, { method: 'POST' }),
  rejectCall: (id: string) => request<{ call: unknown }>(`/v1/calls/${id}/reject`, { method: 'POST' }),
  hangupCall: (id: string) => request<{ call: unknown }>(`/v1/calls/${id}/hangup`, { method: 'POST' }),
};
