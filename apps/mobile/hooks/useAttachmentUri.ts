import { Directory, File, Paths } from 'expo-file-system';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { decryptBytes, isEncryptedPath } from '@/lib/crypto/e2e';
import { extensionForMime } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Attachment } from '@/lib/types';

export type AttachmentUriState = {
  /** Local `file://` (native) / blob URL (web) for decrypted media, or a signed URL for legacy plain media. */
  uri: string | null;
  loading: boolean;
  error: string | null;
};

const SIGNED_URL_TTL = 3600;

function cacheDir(): Directory {
  const dir = new Directory(Paths.cache, 'e2e-media');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

async function decryptToLocalUri(attachment: Attachment, sharedKey: Uint8Array): Promise<string> {
  const ext = extensionForMime(attachment.mime);
  const fileName = `${attachment.id}.${ext}`;

  if (Platform.OS !== 'web') {
    const target = new File(cacheDir(), fileName);
    if (target.exists && target.size > 0) return target.uri;
  }

  const { data, error } = await supabase.storage
    .from(attachment.bucket)
    .createSignedUrl(attachment.path, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? 'Нет ссылки на файл');

  const response = await fetch(data.signedUrl);
  if (!response.ok) throw new Error(`Загрузка не удалась (${response.status})`);
  const cipher = new Uint8Array(await response.arrayBuffer());
  const plain = decryptBytes(sharedKey, cipher);
  if (!plain) throw new Error('Не удалось расшифровать файл');

  if (Platform.OS === 'web') {
    return URL.createObjectURL(new Blob([plain as BlobPart], { type: attachment.mime }));
  }
  const target = new File(cacheDir(), fileName);
  if (target.exists) target.delete();
  target.write(plain);
  return target.uri;
}

/** Resolves a playable/viewable URI for an attachment, transparently decrypting E2E media. */
export function useAttachmentUri(
  attachment: Attachment | undefined,
  sharedKey: Uint8Array | null,
): AttachmentUriState {
  const [state, setState] = useState<AttachmentUriState>({ uri: null, loading: Boolean(attachment), error: null });
  const encrypted = attachment ? isEncryptedPath(attachment.path) : false;

  useEffect(() => {
    if (!attachment) {
      setState({ uri: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ uri: null, loading: true, error: null });

    const run = async () => {
      if (encrypted) {
        if (!sharedKey) {
          setState({ uri: null, loading: false, error: 'Нет ключа для расшифровки' });
          return;
        }
        const uri = await decryptToLocalUri(attachment, sharedKey);
        if (!cancelled) setState({ uri, loading: false, error: null });
        return;
      }
      const { data, error } = await supabase.storage
        .from(attachment.bucket)
        .createSignedUrl(attachment.path, SIGNED_URL_TTL);
      if (cancelled) return;
      if (error || !data?.signedUrl) {
        setState({ uri: null, loading: false, error: error?.message ?? 'Нет ссылки' });
        return;
      }
      setState({ uri: data.signedUrl, loading: false, error: null });
    };

    run().catch((err: unknown) => {
      if (!cancelled) {
        setState({ uri: null, loading: false, error: err instanceof Error ? err.message : 'Ошибка файла' });
      }
    });
    return () => {
      cancelled = true;
    };
    // attachment identity is fully described by id + path
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment?.id, attachment?.path, encrypted, sharedKey]);

  return state;
}
