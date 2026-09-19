import { useEffect, useState } from 'react';

import { SAVED_MESSAGES_TITLE } from '@/lib/chat';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';

export type ConversationPeer = {
  /** Other participant (null for "Saved messages"). */
  peer: Profile | null;
  /** User id whose key is used for E2E: the peer, or myself for saved messages. */
  peerId: string | null;
  title: string;
  isSaved: boolean;
  loading: boolean;
};

export function useConversationPeer(conversationId: string | undefined): ConversationPeer {
  const { session } = useAuth();
  const myId = session?.user.id;
  const [state, setState] = useState<ConversationPeer>({
    peer: null,
    peerId: null,
    title: 'Чат',
    isSaved: false,
    loading: true,
  });

  useEffect(() => {
    if (!conversationId || !myId) return;
    let cancelled = false;
    const run = async () => {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('title')
        .eq('id', conversationId)
        .maybeSingle();
      if (cancelled) return;
      if (conversation?.title === SAVED_MESSAGES_TITLE) {
        setState({ peer: null, peerId: myId, title: SAVED_MESSAGES_TITLE, isSaved: true, loading: false });
        return;
      }
      const { data } = await supabase
        .from('conversation_members')
        .select('user_id, profiles(*)')
        .eq('conversation_id', conversationId);
      if (cancelled) return;
      const other = (data ?? []).find((row) => row.user_id !== myId) as
        | { user_id: string; profiles: Profile | Profile[] | null }
        | undefined;
      const profile = Array.isArray(other?.profiles) ? other?.profiles[0] ?? null : other?.profiles ?? null;
      setState({
        peer: profile,
        peerId: other?.user_id ?? null,
        title: profile?.display_name || profile?.username || 'Чат',
        isSaved: false,
        loading: false,
      });
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [conversationId, myId]);

  return state;
}
