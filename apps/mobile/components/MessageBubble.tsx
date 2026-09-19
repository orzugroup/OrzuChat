import * as Sharing from 'expo-sharing';
import { ActivityIndicator, Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { VoiceNote } from '@/components/VoiceNote';
import { useAttachmentUri } from '@/hooks/useAttachmentUri';
import { showAlert } from '@/lib/alert';
import { formatTime } from '@/lib/format';
import { colors } from '@/lib/theme';
import type { Message } from '@/lib/types';

type Props = {
  message: Message;
  mine: boolean;
  /** E2E key for the conversation; needed to decrypt media. */
  sharedKey: Uint8Array | null;
};

async function openExternally(uri: string, mime: string) {
  try {
    if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(uri, { mimeType: mime });
      return;
    }
    await Linking.openURL(uri);
  } catch (error) {
    showAlert('Файл', error instanceof Error ? error.message : 'Не удалось открыть');
  }
}

export function MessageBubble({ message, mine, sharedKey }: Props) {
  const attachment = message.attachments?.[0];
  const media = useAttachmentUri(attachment, sharedKey);
  const mime = attachment?.mime ?? 'application/octet-stream';

  const renderMedia = () => {
    if (!attachment) return null;
    if (media.error) {
      return (
        <View style={styles.mediaError}>
          <AppIcon ios="lock.slash" android="lock" color={colors.muted} size={16} />
          <Text style={styles.mediaErrorText}>{media.error}</Text>
        </View>
      );
    }
    if (message.type === 'image') {
      return media.uri ? (
        <Pressable onPress={() => void openExternally(media.uri!, mime)}>
          <Image source={{ uri: media.uri }} style={styles.image} />
        </Pressable>
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <ActivityIndicator color={colors.text} />
        </View>
      );
    }
    if (message.type === 'video') {
      return (
        <Pressable
          disabled={!media.uri}
          onPress={() => media.uri && void openExternally(media.uri, mime)}
          style={styles.video}
        >
          {media.uri ? (
            <AppIcon ios="play.circle.fill" android="play_circle" color="#fff" size={44} />
          ) : (
            <ActivityIndicator color="#fff" />
          )}
          <Text style={styles.mediaLabel}>Видео</Text>
        </Pressable>
      );
    }
    if (message.type === 'voice') {
      return <VoiceNote uri={media.uri} durationMs={attachment.duration_ms} />;
    }
    if (message.type === 'file') {
      return (
        <Pressable
          disabled={!media.uri}
          onPress={() => media.uri && void openExternally(media.uri, mime)}
          style={styles.file}
        >
          <View style={styles.fileIcon}>
            <AppIcon ios="doc.fill" android="description" color="#fff" size={18} />
          </View>
          <Text style={styles.fileName} numberOfLines={2}>
            {message.body ?? 'Файл'}
          </Text>
          {!media.uri ? <ActivityIndicator color={colors.text} size="small" /> : null}
        </Pressable>
      );
    }
    return null;
  };

  return (
    <View style={[styles.row, mine ? styles.right : styles.left]}>
      <View style={[styles.bubble, mine ? styles.outgoing : styles.incoming]}>
        {renderMedia()}
        {message.type === 'text' && message.undecryptable ? (
          <Text style={styles.undecryptable}>Сообщение зашифровано ключом другого устройства</Text>
        ) : null}
        {message.type === 'text' && message.body ? <Text style={styles.body}>{message.body}</Text> : null}
        <View style={styles.footer}>
          {message.encrypted ? (
            <AppIcon ios="lock.fill" android="lock" color={colors.muted} size={10} />
          ) : null}
          <Text style={styles.time}>{formatTime(message.created_at)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 10, marginVertical: 3, flexDirection: 'row' },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  incoming: { backgroundColor: colors.incoming, borderTopLeftRadius: 6 },
  outgoing: { backgroundColor: colors.outgoing, borderTopRightRadius: 6 },
  body: { color: colors.text, fontSize: 16, lineHeight: 22 },
  undecryptable: { color: colors.muted, fontSize: 13, fontStyle: 'italic' },
  mediaLabel: { color: colors.text, fontWeight: '600' },
  image: { width: 220, height: 220, borderRadius: 10, marginBottom: 4 },
  placeholder: { backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  video: {
    width: 220,
    height: 140,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  file: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 180, paddingVertical: 2 },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: { color: colors.text, flex: 1, fontWeight: '600' },
  mediaError: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  mediaErrorText: { color: colors.muted, fontSize: 13, fontStyle: 'italic' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 },
  time: { color: colors.muted, fontSize: 11 },
});
