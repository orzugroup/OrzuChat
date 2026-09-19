import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { Composer } from '@/components/Composer';
import { MessageBubble } from '@/components/MessageBubble';
import { useConversationPeer } from '@/hooks/useConversationPeer';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';
import { useMessages } from '@/hooks/useMessages';
import { useScreenProtection } from '@/hooks/useScreenProtection';
import { useSharedKey } from '@/hooks/useSharedKey';
import { showAlert } from '@/lib/alert';
import { sendMediaMessage, type MediaPayload } from '@/lib/media';
import { actionColors, colors } from '@/lib/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useCall } from '@/providers/CallProvider';

export default function ChatScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const navigation = useNavigation();
  const { session, screenProtection } = useAuth();
  const { startCall } = useCall();
  const { peer, peerId, title, isSaved, loading: peerLoading } = useConversationPeer(id);
  const shared = useSharedKey(peerId);
  const keyResolved = !peerLoading && (peerId ? shared.resolved : true);
  const { messages, loading, reload, sendText } = useMessages(id, {
    sharedKey: shared.key,
    keyResolved,
  });
  const [callMenu, setCallMenu] = useState(false);
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardInset();

  useScreenProtection(screenProtection, `chat-${id ?? 'none'}`);

  const gap = 20;
  const bottomInset = keyboard > 0 ? (Platform.OS === 'ios' ? gap : keyboard + gap) : insets.bottom;

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerTitle: () => (
        <Pressable
          disabled={!peer}
          onPress={() => peer && router.push({ pathname: '/(app)/profile/[id]', params: { id: peer.id } })}
          style={styles.headerTitleWrap}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {shared.key ? (
            <View style={styles.headerLock}>
              <AppIcon ios="lock.fill" android="lock" color={colors.accentAlt} size={10} />
              <Text style={styles.headerLockText}>Сквозное шифрование</Text>
            </View>
          ) : null}
        </Pressable>
      ),
      headerRight: () =>
        peer ? (
          <Pressable
            accessibilityLabel="Звонок"
            hitSlop={10}
            onPress={() => setCallMenu((open) => !open)}
            style={styles.headerCall}
          >
            <AppIcon ios="phone.fill" android="call" color={colors.accent} size={22} />
          </Pressable>
        ) : null,
    });
  }, [navigation, peer, shared.key, title]);

  const reversed = useMemo(() => [...messages].reverse(), [messages]);
  const inverted = messages.length > 0;
  const listData = inverted ? reversed : messages;

  const onSendText = async (body: string) => {
    try {
      await sendText(body);
    } catch (error) {
      showAlert('Сообщение', error instanceof Error ? error.message : 'Не отправилось');
    }
  };

  const onSendMedia = async (input: MediaPayload) => {
    if (!id || !session?.user.id) return;
    try {
      await sendMediaMessage({ conversationId: id, userId: session.user.id, sharedKey: shared.key, input });
      await reload();
    } catch (error) {
      showAlert('Медиа', error instanceof Error ? error.message : 'Не удалось отправить');
    }
  };

  const securityNote = (
    <View style={styles.notice}>
      <AppIcon
        ios={shared.key ? 'lock.shield.fill' : 'exclamationmark.shield.fill'}
        android="shield"
        color={shared.key ? colors.accentAlt : colors.warning}
        size={16}
      />
      <Text style={styles.noticeText}>
        {shared.key
          ? isSaved
            ? 'Заметки шифруются ключом этого устройства. Прочитать их можно только здесь.'
            : 'Сообщения, фото и голосовые защищены сквозным шифрованием. Ключи хранятся только на ваших устройствах.'
          : keyResolved
            ? 'Собеседник ещё не обновил OrzuChat — сообщения пока отправляются без сквозного шифрования.'
            : 'Проверяем ключи шифрования…'}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <FlatList
        inverted={inverted}
        data={listData}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentContainerStyle={styles.list}
        ListFooterComponent={inverted ? securityNote : null}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {securityNote}
            <Text style={styles.empty}>{loading || !keyResolved ? 'Загрузка…' : 'Напишите первое сообщение'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <MessageBubble message={item} mine={item.sender_id === session?.user.id} sharedKey={shared.key} />
        )}
      />
      {callMenu && peer ? (
        <Pressable style={styles.callScrim} onPress={() => setCallMenu(false)}>
          <View style={styles.callMenu}>
            <Pressable
              accessibilityLabel="Аудиозвонок"
              style={styles.callChoice}
              onPress={() => {
                setCallMenu(false);
                void startCall(peer.id, 'audio', id);
              }}
            >
              <View style={[styles.callCircle, { backgroundColor: actionColors.audioCall }]}>
                <AppIcon ios="phone.fill" android="call" color="#fff" size={22} />
              </View>
            </Pressable>
            <Pressable
              accessibilityLabel="Видеозвонок"
              style={styles.callChoice}
              onPress={() => {
                setCallMenu(false);
                void startCall(peer.id, 'video', id);
              }}
            >
              <View style={[styles.callCircle, { backgroundColor: actionColors.videoCall }]}>
                <AppIcon ios="video.fill" android="videocam" color="#fff" size={22} />
              </View>
            </Pressable>
          </View>
        </Pressable>
      ) : null}
      <View style={[styles.composer, { paddingBottom: bottomInset }]}>
        <Composer onSendText={onSendText} onSendMedia={onSendMedia} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingVertical: 8, flexGrow: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  empty: { color: colors.muted, textAlign: 'center', padding: 24 },
  headerCall: { marginRight: 12, padding: 4 },
  headerTitleWrap: { alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start', maxWidth: 240 },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  headerLock: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  headerLockText: { color: colors.accentAlt, fontSize: 11, fontWeight: '600' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  noticeText: { color: colors.muted, fontSize: 12, flex: 1, lineHeight: 17 },
  callScrim: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 8,
    paddingRight: 12,
  },
  callMenu: { flexDirection: 'row', gap: 12 },
  callChoice: { alignItems: 'center' },
  callCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composer: { backgroundColor: 'transparent' },
});
