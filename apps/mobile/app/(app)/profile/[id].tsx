import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Avatar } from '@/components/Avatar';
import { usePublicProfile } from '@/hooks/usePublicProfile';
import { useSharedKey } from '@/hooks/useSharedKey';
import { showAlert } from '@/lib/alert';
import { createDirectChat, openChatScreen } from '@/lib/chat';
import { formatTime } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { actionColors, colors, gradients } from '@/lib/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useCall } from '@/providers/CallProvider';

export default function ProfileScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { session } = useAuth();
  const { startCall } = useCall();
  const { profile, loading, error } = usePublicProfile(id);
  const shared = useSharedKey(id);
  const [busy, setBusy] = useState(false);
  const isMe = session?.user.id === id;

  useEffect(() => {
    if (error) showAlert('Профиль', error);
  }, [error]);

  const addContact = async () => {
    if (!session?.user.id || !profile || isMe) return;
    setBusy(true);
    const { error } = await supabase.from('user_contacts').upsert(
      {
        owner_id: session.user.id,
        contact_id: profile.id,
        device_name: profile.display_name,
      },
      { onConflict: 'owner_id,contact_id' },
    );
    setBusy(false);
    if (error) {
      showAlert('Контакт', error.message);
      return;
    }
    showAlert('Контакт', 'Добавлен в контакты');
  };

  const openChat = async () => {
    if (!profile || isMe) return;
    setBusy(true);
    try {
      const conversationId = await createDirectChat(profile.id);
      openChatScreen(conversationId);
    } catch (error) {
      showAlert('Чат', error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Профиль не найден</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.banner}>
        {profile.banner_url ? (
          <Image source={{ uri: profile.banner_url }} style={styles.bannerImage} />
        ) : (
          <LinearGradient colors={[...gradients.banner]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bannerEmpty} />
        )}
      </View>
      <View style={styles.header}>
        <Avatar
          name={profile.display_name || profile.username || 'User'}
          uri={profile.avatar_url}
          size={88}
        />
        <Text style={styles.name}>{profile.display_name || 'Пользователь'}</Text>
        {profile.username ? <Text style={styles.username}>@{profile.username}</Text> : null}
        {profile.phone ? <Text style={styles.meta}>{profile.phone}</Text> : null}
        {profile.last_seen_at ? (
          <Text style={styles.meta}>Был(а): {formatTime(profile.last_seen_at)}</Text>
        ) : null}
        {!isMe && shared.resolved ? (
          <View style={[styles.secure, !shared.key && styles.secureOff]}>
            <AppIcon
              ios={shared.key ? 'lock.fill' : 'lock.open.fill'}
              android="lock"
              color={shared.key ? colors.accentAlt : colors.warning}
              size={11}
            />
            <Text style={[styles.secureText, { color: shared.key ? colors.accentAlt : colors.warning }]}>
              {shared.key ? 'Сквозное шифрование доступно' : 'Шифрование появится после обновления у собеседника'}
            </Text>
          </View>
        ) : null}
      </View>

      {!isMe ? (
        <View style={styles.actions}>
          <Pressable style={styles.action} onPress={() => void openChat()} disabled={busy}>
            <AppIcon ios="bubble.left.fill" android="chat" color="#fff" size={20} />
            <Text style={styles.actionText}>Чат</Text>
          </Pressable>
          <Pressable
            style={[styles.action, styles.actionAlt]}
            onPress={() => void startCall(profile.id, 'audio')}
          >
            <AppIcon ios="phone.fill" android="call" color="#fff" size={20} />
          </Pressable>
          <Pressable
            style={[styles.action, styles.actionVideo]}
            onPress={() => void startCall(profile.id, 'video')}
          >
            <AppIcon ios="video.fill" android="videocam" color="#fff" size={20} />
          </Pressable>
          <Pressable style={[styles.action, styles.actionSoft]} onPress={() => void addContact()} disabled={busy}>
            <AppIcon ios="person.badge.plus" android="person_add" color={colors.accent} size={20} />
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.edit} onPress={() => router.push('/(app)/(tabs)/settings')}>
          <Text style={styles.editText}>Редактировать профиль</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.muted },
  banner: { height: 160, backgroundColor: colors.surfaceAlt },
  bannerImage: { width: '100%', height: '100%' },
  bannerEmpty: { flex: 1 },
  header: { alignItems: 'center', marginTop: -44, paddingHorizontal: 20 },
  name: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 12 },
  username: { color: colors.accentCyan, marginTop: 4, fontSize: 16 },
  meta: { color: colors.muted, marginTop: 6 },
  secure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,214,154,0.12)',
  },
  secureOff: { backgroundColor: 'rgba(255,180,84,0.12)' },
  secureText: { fontSize: 11, fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  action: {
    minWidth: 72,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
  },
  actionAlt: { backgroundColor: actionColors.audioCall, minWidth: 48, paddingHorizontal: 0 },
  actionVideo: { backgroundColor: actionColors.videoCall, minWidth: 48, paddingHorizontal: 0 },
  actionSoft: {
    backgroundColor: colors.surfaceAlt,
    minWidth: 48,
    paddingHorizontal: 0,
  },
  actionText: { color: '#fff', fontWeight: '700' },
  edit: {
    marginTop: 24,
    marginHorizontal: 40,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  editText: { color: colors.accentCyan, fontWeight: '700' },
});
