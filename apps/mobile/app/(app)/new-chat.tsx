import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { showAlert } from '@/lib/alert';
import { createDirectChat } from '@/lib/chat';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';

export default function NewChatScreen() {
  const [query, setQuery] = useState('');

  const start = async () => {
    const value = query.trim().replace(/^@/, '');
    if (!value) return;
    const { data, error } = await supabase.rpc('find_profile_by_username', { uname: value });
    if (error) {
      showAlert('Поиск', error.message);
      return;
    }
    const profile = Array.isArray(data) ? data[0] : data;
    if (!profile?.id) {
      showAlert('Не найден', 'Проверьте username.');
      return;
    }
    try {
      const conversationId = await createDirectChat(profile.id);
      router.replace(`/(app)/chat/${conversationId}`);
    } catch (rpcError) {
      showAlert('Чат', rpcError instanceof Error ? rpcError.message : 'Не удалось открыть чат');
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.label}>Username</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        placeholder="@username"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      <Pressable style={styles.primary} onPress={() => void start()}>
        <Text style={styles.primaryText}>Начать чат</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  label: { color: colors.muted, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  primary: {
    marginTop: 20,
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  primaryText: { color: colors.text, fontWeight: '700' },
});
