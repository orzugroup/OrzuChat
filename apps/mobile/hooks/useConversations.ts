import { useCallback, useEffect, useState } from 'react';

import { decodeMessage } from '@/hooks/useMessages';
import { SAVED_MESSAGES_TITLE } from '@/lib/chat';
import { sharedKeyWith } from '@/lib/crypto/e2e';
import { supabase } from '@/lib/supabase';
import type { Conversation, Message, Profile } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';

export type ConversationPreview = {
  conversation: Conversation;
  peer: Profile | null;
  lastMessage: Message | null;
  unread: number;
};

type MemberRow = {
  conversation_id: string;
  last_read_at: string | null;
  conversations: Conversation | Conversation[] | null;
};

export function useConversations() {
  const { session } = useAuth();
  const [items, setItems] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.user.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data: memberRows, error } = await supabase
      .from('conversation_members')
      .select('conversation_id, last_read_at, conversations(*)')
      .eq('user_id', session.user.id);
    if (error) {
      console.warn(error.message);
      setLoading(false);
      return;
    }

    const rows = (memberRows ?? []) as MemberRow[];
    const previews: ConversationPreview[] = [];

    for (const row of rows) {
      const conversation = Array.isArray(row.conversations)
        ? row.conversations[0]
        : row.conversations;
      if (!conversation) continue;

      const { data: members } = await supabase
        .from('conversation_members')
        .select('user_id, profiles(*)')
        .eq('conversation_id', conversation.id);

      const peerRow = (members ?? []).find((member) => member.user_id !== session.user.id) as
        | { user_id: string; profiles: Profile | Profile[] | null }
        | undefined;
      const peer = Array.isArray(peerRow?.profiles) ? peerRow?.profiles[0] ?? null : peerRow?.profiles ?? null;

      const { data: lastMessages } = await supabase
        .from('messages')
        .select('*, attachments(*)')
        .eq('conversation_id', conversation.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastRow = (lastMessages?.[0] as Message | undefined) ?? null;
      let lastMessage: Message | null = lastRow;
      if (lastRow) {
        const keyOwner = conversation.title === SAVED_MESSAGES_TITLE ? session.user.id : peer?.id ?? null;
        const key = keyOwner ? await sharedKeyWith(keyOwner) : null;
        lastMessage = decodeMessage(lastRow, key);
      }
      let unread = 0;
      if (row.last_read_at) {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .gt('created_at', row.last_read_at)
          .neq('sender_id', session.user.id);
        unread = count ?? 0;
      } else {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .neq('sender_id', session.user.id);
        unread = count ?? 0;
      }

      previews.push({ conversation, peer, lastMessage, unread });
    }

    previews.sort((a, b) => {
      const left = a.conversation.last_message_at ?? a.conversation.created_at;
      const right = b.conversation.last_message_at ?? b.conversation.created_at;
      return right.localeCompare(left);
    });

    setItems(previews);
    setLoading(false);
  }, [session?.user.id]);

  useEffect(() => {
    void load();
    if (!session?.user.id) return;
    const channel = supabase
      .channel('inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        void load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_members' }, () => {
        void load();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, session?.user.id]);

  return { items, loading, reload: load };
}
