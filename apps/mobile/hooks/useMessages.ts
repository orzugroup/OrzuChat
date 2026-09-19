import { useCallback, useEffect, useState } from 'react';

import { decryptText, encryptText, isEncryptedText } from '@/lib/crypto/e2e';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';

/** Turns a stored row into a renderable message, decrypting the body when possible. */
export function decodeMessage(row: Message, sharedKey: Uint8Array | null): Message {
  if (!isEncryptedText(row.body)) return row;
  if (!sharedKey) return { ...row, body: null, encrypted: true, undecryptable: true };
  const plain = decryptText(sharedKey, row.body, row.id);
  if (plain === null) return { ...row, body: null, encrypted: true, undecryptable: true };
  return { ...row, body: plain, encrypted: true };
}

type Options = {
  /** E2E shared key with the peer; when null messages are sent in clear text. */
  sharedKey: Uint8Array | null;
  /** Wait for key resolution before loading so encrypted history renders on first paint. */
  keyResolved: boolean;
};

export function useMessages(conversationId: string | undefined, { sharedKey, keyResolved }: Options) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('messages')
      .select('*, attachments(*)')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(200);
    if (error) {
      console.warn(error.message);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as Message[];
    setMessages(rows.map((row) => decodeMessage(row, sharedKey)));
    setLoading(false);

    const incomingIds = rows
      .filter((message) => message.sender_id !== session?.user.id)
      .map((message) => message.id);
    if (incomingIds.length) {
      await supabase.rpc('mark_messages_delivered', { message_ids: incomingIds });
    }
    await supabase.rpc('mark_conversation_read', { cid: conversationId });
  }, [conversationId, session?.user.id, sharedKey]);

  const sendText = useCallback(
    async (body: string) => {
      if (!conversationId || !session?.user.id) {
        throw new Error('Нет чата');
      }
      const tempId = `tmp-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: session.user.id,
        type: 'text',
        body,
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
        attachments: [],
        encrypted: Boolean(sharedKey),
      };
      setMessages((current) => [...current, optimistic]);
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: session.user.id,
          type: 'text',
          body: sharedKey ? encryptText(sharedKey, body) : body,
        })
        .select('*, attachments(*)')
        .single();
      if (error || !data) {
        setMessages((current) => current.filter((item) => item.id !== tempId));
        throw new Error(error?.message ?? 'Сообщение не отправилось');
      }
      setMessages((current) =>
        current.map((item) => (item.id === tempId ? decodeMessage(data as Message, sharedKey) : item)),
      );
    },
    [conversationId, session?.user.id, sharedKey],
  );

  useEffect(() => {
    if (!keyResolved) return;
    void load();
    if (!conversationId) return;
    // Unique topic per subscription: re-subscribing under the same name while the previous
    // channel is still tearing down makes supabase reuse it and reject new callbacks.
    const channel = supabase
      .channel(`messages:${conversationId}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, keyResolved, load]);

  return { messages, loading, reload: load, sendText };
}
