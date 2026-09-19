import * as Contacts from 'expo-contacts/legacy';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Avatar } from '@/components/Avatar';
import { showAlert } from '@/lib/alert';
import { createDirectChat, createSavedMessagesChat, openChatScreen } from '@/lib/chat';
import { normalizePhoneDigits } from '@/lib/phone';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import type { Profile } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useCall } from '@/providers/CallProvider';

type ContactRow = {
  contactId: string;
  deviceName: string | null;
  profile: Profile;
};

export default function ContactsScreen() {
  const { session } = useAuth();
  const { startCall } = useCall();
  const navigation = useNavigation();
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [searching, setSearching] = useState(false);

  const loadContacts = useCallback(async () => {
    if (!session?.user.id) return;
    const { data, error } = await supabase
      .from('user_contacts')
      .select(
        'contact_id, device_name, profiles:contact_id(id, username, display_name, avatar_url, phone, last_seen_at)',
      )
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: true });
    if (error) {
      showAlert('Контакты', error.message);
      return;
    }
    const next: ContactRow[] = [];
    for (const row of data ?? []) {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      if (!profile?.id) continue;
      next.push({
        contactId: row.contact_id,
        deviceName: row.device_name,
        profile: profile as Profile,
      });
    }
    setRows(next);
  }, [session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      void loadContacts();
    }, [loadContacts]),
  );

  const addFromDevice = useCallback(async () => {
    if (!session?.user.id || busy) return;
    setBusy(true);
    try {
      const permission = await Contacts.requestPermissionsAsync();
      if (!permission.granted) {
        showAlert('Контакты', 'Разрешите доступ к контактам телефона.');
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });
      const phoneMap = new Map<string, string>();
      for (const contact of data) {
        const name = contact.name?.trim() || 'Контакт';
        for (const item of contact.phoneNumbers ?? []) {
          const digits = normalizePhoneDigits(item.number ?? '');
          if (digits.length >= 8) phoneMap.set(digits, name);
        }
      }
      const phones = [...phoneMap.keys()];
      if (!phones.length) {
        showAlert('Контакты', 'На устройстве нет номеров телефонов.');
        return;
      }

      const { data: matches, error } = await supabase.rpc('match_profiles_by_phones', { phones });
      if (error) throw error;
      const found = (matches ?? []) as Array<Profile & { matched_phone?: string }>;
      if (!found.length) {
        showAlert('Контакты', 'Пока никто из ваших контактов не в OrzuChat.');
        return;
      }

      let added = 0;
      for (const profile of found) {
        const deviceName =
          phoneMap.get(normalizePhoneDigits(profile.matched_phone ?? profile.phone ?? '')) ??
          profile.display_name;
        const { error: insertError } = await supabase.from('user_contacts').upsert(
          {
            owner_id: session.user.id,
            contact_id: profile.id,
            device_name: deviceName,
          },
          { onConflict: 'owner_id,contact_id' },
        );
        if (!insertError) added += 1;
      }
      await loadContacts();
      showAlert('Контакты', `Добавлено: ${added}`);
    } catch (error) {
      showAlert('Контакты', error instanceof Error ? error.message : 'Не удалось добавить');
    } finally {
      setBusy(false);
    }
  }, [busy, loadContacts, session?.user.id]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="Поиск по username"
            hitSlop={8}
            onPress={() => setSearchOpen(true)}
            style={styles.headerBtn}
          >
            <AppIcon ios="magnifyingglass" android="search" color={colors.accent} size={22} />
          </Pressable>
          <Pressable
            accessibilityLabel="Добавить контакт"
            hitSlop={8}
            onPress={() => void addFromDevice()}
            style={styles.headerBtn}
          >
            <AppIcon ios="person.badge.plus" android="person_add" color={colors.accent} size={22} />
          </Pressable>
        </View>
      ),
    });
  }, [addFromDevice, navigation]);

  const searchByUsername = async () => {
    const value = username.trim().replace(/^@/, '').toLowerCase();
    if (!value) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.rpc('find_profile_by_username', { uname: value });
      if (error) throw error;
      const profile = Array.isArray(data) ? data[0] : data;
      if (!profile?.id) {
        showAlert('Поиск', 'Пользователь не найден');
        return;
      }
      if (profile.id === session?.user.id) {
        showAlert('Поиск', 'Это ваш аккаунт');
        return;
      }
      setSearchOpen(false);
      setUsername('');
      router.push({ pathname: '/(app)/profile/[id]', params: { id: profile.id } });
    } catch (error) {
      showAlert('Поиск', error instanceof Error ? error.message : 'Ошибка поиска');
    } finally {
      setSearching(false);
    }
  };

  const openChat = async (profile: Profile) => {
    if (openingId) return;
    setOpeningId(profile.id);
    try {
      const conversationId = await createDirectChat(profile.id);
      openChatScreen(conversationId);
    } catch (error) {
      showAlert('Чат', error instanceof Error ? error.message : 'Не удалось открыть чат');
    } finally {
      setOpeningId(null);
    }
  };

  const openSaved = async () => {
    if (!session?.user.id || openingId) return;
    setOpeningId('saved');
    try {
      const conversationId = await createSavedMessagesChat(session.user.id);
      openChatScreen(conversationId);
    } catch (error) {
      showAlert('Чат', error instanceof Error ? error.message : 'Не удалось открыть Избранное');
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <View style={styles.screen}>
      {busy ? (
        <View style={styles.busy}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.busyText}>Ищем контакты на устройстве…</Text>
        </View>
      ) : null}
      <Pressable style={styles.saved} onPress={() => void openSaved()}>
        <Avatar name="Избранное" />
        <View style={styles.meta}>
          <Text style={styles.name}>Избранное</Text>
          <Text style={styles.sub}>Заметки</Text>
        </View>
        {openingId === 'saved' ? <ActivityIndicator color={colors.accent} /> : null}
      </Pressable>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.contactId}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Здесь только ваши контакты с телефона, которые тоже в OrzuChat. Нажмите + сверху, чтобы
            добавить.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable
              style={styles.person}
              onPress={() => router.push({ pathname: '/(app)/profile/[id]', params: { id: item.profile.id } })}
              onLongPress={() => void openChat(item.profile)}
            >
              <Avatar
                name={item.deviceName || item.profile.display_name || item.profile.username}
                uri={item.profile.avatar_url}
              />
              <View style={styles.meta}>
                <Text style={styles.name}>
                  {item.deviceName || item.profile.display_name || item.profile.username}
                </Text>
                <Text style={styles.sub}>
                  {item.profile.username ? `@${item.profile.username}` : 'В OrzuChat'}
                </Text>
              </View>
            </Pressable>
            <Pressable style={styles.chatBtn} onPress={() => void openChat(item.profile)}>
              {openingId === item.profile.id ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <AppIcon
                  ios="bubble.left.fill"
                  android="chat"
                  color={colors.accent}
                  size={20}
                />
              )}
            </Pressable>
            <Pressable style={styles.chatBtn} onPress={() => void startCall(item.profile.id, 'audio')}>
              <AppIcon ios="phone.fill" android="call" color={colors.accent} size={20} />
            </Pressable>
          </View>
        )}
      />

      <Modal visible={searchOpen} transparent animationType="fade" onRequestClose={() => setSearchOpen(false)}>
        <Pressable style={styles.modalScrim} onPress={() => setSearchOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Поиск по username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="@username"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <Pressable style={styles.primary} onPress={() => void searchByUsername()} disabled={searching}>
              <Text style={styles.primaryText}>{searching ? 'Поиск…' : 'Найти'}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  headerActions: { flexDirection: 'row', gap: 4, marginRight: 8 },
  headerBtn: { padding: 6 },
  busy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  busyText: { color: colors.muted },
  saved: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  empty: { color: colors.muted, textAlign: 'center', padding: 32, fontSize: 15, lineHeight: 22 },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  person: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center' },
  meta: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  sub: { color: colors.muted, marginTop: 2 },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  primary: {
    marginTop: 14,
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  primaryText: { color: colors.text, fontWeight: '700' },
});
