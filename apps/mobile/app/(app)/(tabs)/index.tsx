import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Avatar } from '@/components/Avatar';
import { useConversations } from '@/hooks/useConversations';
import { useOnlineMap } from '@/hooks/usePushRegistration';
import { SAVED_MESSAGES_TITLE } from '@/lib/chat';
import { formatTime } from '@/lib/format';
import { colors, gradients } from '@/lib/theme';
import type { Message } from '@/lib/types';

const TYPE_LABELS: Record<Message['type'], string> = {
  text: '',
  image: 'Фото',
  video: 'Видео',
  voice: 'Голосовое сообщение',
  file: 'Файл',
  system: 'Системное сообщение',
};

function previewFor(message: Message | null): string {
  if (!message) return 'Нет сообщений';
  if (message.type === 'text') {
    if (message.undecryptable) return 'Зашифрованное сообщение';
    return message.body ?? '';
  }
  if (message.type === 'file' && message.body && !message.undecryptable) return message.body;
  return TYPE_LABELS[message.type];
}

export default function ChatsScreen() {
  const { items, loading } = useConversations();
  const online = useOnlineMap(items.map((item) => item.peer?.id).filter(Boolean) as string[]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.conversation.id}
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <AppIcon ios="lock.shield.fill" android="shield" color={colors.accentAlt} size={40} />
            <Text style={styles.emptyTitle}>Пока нет чатов</Text>
            <Text style={styles.empty}>
              Найдите человека во вкладке Контакты. Все переписки защищены сквозным шифрованием.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isSaved = item.conversation.title === SAVED_MESSAGES_TITLE;
          const name = isSaved ? SAVED_MESSAGES_TITLE : item.peer?.display_name || item.peer?.username || 'Чат';
          const preview = previewFor(item.lastMessage);
          return (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => router.push(`/(app)/chat/${item.conversation.id}`)}
            >
              <Avatar
                name={name}
                uri={item.peer?.avatar_url}
                online={item.peer ? online[item.peer.id] : false}
                size={52}
              />
              <View style={styles.meta}>
                <View style={styles.top}>
                  <Text style={styles.name} numberOfLines={1}>
                    {name}
                  </Text>
                  {item.lastMessage ? (
                    <Text style={[styles.time, item.unread > 0 && styles.timeUnread]}>
                      {formatTime(item.lastMessage.created_at)}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.top}>
                  <Text style={[styles.preview, item.unread > 0 && styles.previewUnread]} numberOfLines={1}>
                    {preview}
                  </Text>
                  {item.unread > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unread}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
      <Pressable accessibilityLabel="Новый чат" style={styles.fab} onPress={() => router.push('/(app)/new-chat')}>
        <LinearGradient colors={[...gradients.brand]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabInner}>
          <AppIcon ios="square.and.pencil" android="chat" color="#fff" size={24} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 96 },
  emptyList: { flexGrow: 1, justifyContent: 'center', padding: 32 },
  emptyBox: { alignItems: 'center', gap: 10 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  empty: { color: colors.muted, textAlign: 'center', fontSize: 15, lineHeight: 21 },
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  rowPressed: { backgroundColor: colors.surface },
  meta: { flex: 1, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { color: colors.text, fontSize: 17, fontWeight: '700', flex: 1 },
  time: { color: colors.muted, fontSize: 12 },
  timeUnread: { color: colors.accentAlt, fontWeight: '700' },
  preview: { color: colors.muted, marginTop: 4, flex: 1 },
  previewUnread: { color: colors.text },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accentAlt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: colors.bg, fontSize: 12, fontWeight: '800' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
  },
  fabInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
