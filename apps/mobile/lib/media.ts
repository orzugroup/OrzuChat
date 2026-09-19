import { encryptBytes, encryptText, encryptedPath } from '@/lib/crypto/e2e';
import { extensionForMime } from '@/lib/format';
import { readUriBytes } from '@/lib/readFile';
import { supabase } from '@/lib/supabase';
import type { MessageType } from '@/lib/types';

export const MEDIA_BUCKET = 'media';

export type MediaPayload = {
  uri: string;
  mime: string;
  name: string;
  type: Extract<MessageType, 'image' | 'video' | 'file' | 'voice'>;
  durationMs?: number;
};

type SendMediaArgs = {
  conversationId: string;
  userId: string;
  /** When present, bytes (and the file name) are encrypted before upload. */
  sharedKey: Uint8Array | null;
  input: MediaPayload;
};

/**
 * Uploads a media file to Supabase Storage and creates the message + attachment rows.
 * With an E2E key the object stored on the server is ciphertext (`*.enc`, octet-stream).
 */
export async function sendMediaMessage({ conversationId, userId, sharedKey, input }: SendMediaArgs): Promise<void> {
  const ext = extensionForMime(input.mime);
  const basePath = `${userId}/${conversationId}/${Date.now()}.${ext}`;
  const plain = await readUriBytes(input.uri);
  const bytes = sharedKey ? encryptBytes(sharedKey, plain) : plain;
  const path = sharedKey ? encryptedPath(basePath) : basePath;

  const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, bytes, {
    contentType: sharedKey ? 'application/octet-stream' : input.mime,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const body = input.type === 'file' ? (sharedKey ? encryptText(sharedKey, input.name) : input.name) : null;
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      type: input.type,
      body,
    })
    .select('id')
    .single();
  if (messageError || !message) throw messageError ?? new Error('Сообщение не создано');

  const { error: attachError } = await supabase.from('attachments').insert({
    message_id: message.id,
    bucket: MEDIA_BUCKET,
    path,
    mime: input.mime,
    size_bytes: plain.byteLength,
    duration_ms: input.durationMs ?? null,
  });
  if (attachError) throw attachError;
}
