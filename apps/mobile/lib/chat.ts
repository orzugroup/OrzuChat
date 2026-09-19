import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';

export const SAVED_MESSAGES_TITLE = 'Избранное';

export async function createDirectChat(otherUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_direct_conversation', {
    other_user_id: otherUserId,
  });
  if (error) {
    throw new Error(error.message);
  }
  const conversationId = typeof data === 'string' ? data.trim() : data != null ? String(data) : '';
  if (!conversationId) {
    throw new Error('Чат не создался. Запустите SQL apply_if_not_exists в Supabase.');
  }
  return conversationId;
}

export function openChatScreen(conversationId: string): void {
  router.push(`/(app)/chat/${conversationId}`);
}

export async function createSavedMessagesChat(userId: string): Promise<string> {
  const { data: existing, error: existingError } = await supabase
    .from('conversations')
    .select('id')
    .eq('created_by', userId)
    .eq('title', SAVED_MESSAGES_TITLE)
    .maybeSingle();
  if (existingError) {
    throw new Error(existingError.message);
  }
  if (existing?.id) {
    return existing.id;
  }

  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({ created_by: userId, is_group: false, title: SAVED_MESSAGES_TITLE })
    .select('id')
    .single();
  if (error || !conversation) {
    throw new Error(error?.message ?? 'Не удалось создать Избранное');
  }

  const { error: memberError } = await supabase.from('conversation_members').insert({
    conversation_id: conversation.id,
    user_id: userId,
  });
  if (memberError) {
    throw new Error(memberError.message);
  }
  return conversation.id;
}
