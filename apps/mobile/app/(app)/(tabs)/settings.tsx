import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Avatar } from '@/components/Avatar';
import { setAppSwitcherProtection } from '@/hooks/useScreenProtection';
import { showAlert } from '@/lib/alert';
import { identityFingerprint } from '@/lib/crypto/e2e';
import { extensionForMime } from '@/lib/format';
import { readUriBytes } from '@/lib/readFile';
import { supabase } from '@/lib/supabase';
import { colors, gradients } from '@/lib/theme';
import { useAuth } from '@/providers/AuthProvider';

export default function ProfileSettingsScreen() {
  const { profile, signOut, refreshProfile, session } = useAuth();
  const [name, setName] = useState(profile?.display_name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [busy, setBusy] = useState(false);
  const [showUsername, setShowUsername] = useState(profile?.show_username ?? true);
  const [showAvatar, setShowAvatar] = useState(profile?.show_avatar ?? true);
  const [showBanner, setShowBanner] = useState(profile?.show_banner ?? true);
  const [showPhone, setShowPhone] = useState(profile?.show_phone ?? false);
  const [showLastSeen, setShowLastSeen] = useState(profile?.show_last_seen ?? true);
  const [showReadReceipts, setShowReadReceipts] = useState(profile?.show_read_receipts ?? true);
  const [blockCapture, setBlockCapture] = useState(profile?.block_screen_capture ?? true);
  const fingerprint = identityFingerprint();

  useEffect(() => {
    setName(profile?.display_name ?? '');
    setUsername(profile?.username ?? '');
    setShowUsername(profile?.show_username ?? true);
    setShowAvatar(profile?.show_avatar ?? true);
    setShowBanner(profile?.show_banner ?? true);
    setShowPhone(profile?.show_phone ?? false);
    setShowLastSeen(profile?.show_last_seen ?? true);
    setShowReadReceipts(profile?.show_read_receipts ?? true);
    setBlockCapture(profile?.block_screen_capture ?? true);
  }, [profile]);

  const uploadImage = async (kind: 'avatar' | 'banner') => {
    if (!session?.user.id) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Галерея', 'Нужен доступ к фото.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: kind === 'banner' ? 0.75 : 0.85,
      allowsEditing: true,
      aspect: kind === 'banner' ? [16, 7] : [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setBusy(true);
    try {
      const mime = asset.mimeType ?? 'image/jpeg';
      const ext = extensionForMime(mime);
      const path = `${session.user.id}/${kind}.${ext}`;
      const bytes = await readUriBytes(asset.uri);
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, bytes, {
        contentType: mime,
        upsert: true,
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      const patch = kind === 'avatar' ? { avatar_url: url } : { banner_url: url };
      const { error } = await supabase.from('profiles').update(patch).eq('id', session.user.id);
      if (error) throw error;
      await refreshProfile();
    } catch (error) {
      showAlert('Фото', error instanceof Error ? error.message : 'Не удалось загрузить');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!profile) return;
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      showAlert('Профиль', 'Username: минимум 3 символа (a-z, 0-9, _)');
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: name.trim() || cleanUsername,
        username: cleanUsername,
        show_username: showUsername,
        show_avatar: showAvatar,
        show_banner: showBanner,
        show_phone: showPhone,
        show_last_seen: showLastSeen,
        show_read_receipts: showReadReceipts,
        block_screen_capture: blockCapture,
      })
      .eq('id', profile.id);
    setBusy(false);
    if (error) {
      showAlert('Профиль', error.message);
      return;
    }
    await setAppSwitcherProtection(blockCapture);
    await refreshProfile();
    showAlert('Профиль', 'Сохранено');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.banner} onPress={() => void uploadImage('banner')} disabled={busy}>
        {profile?.banner_url ? (
          <Image source={{ uri: profile.banner_url }} style={styles.bannerImage} />
        ) : (
          <LinearGradient colors={[...gradients.banner]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bannerImage}>
            <Text style={styles.bannerHint}>Нажмите, чтобы поставить баннер</Text>
          </LinearGradient>
        )}
      </Pressable>

      <View style={styles.avatarRow}>
        <Pressable onPress={() => void uploadImage('avatar')} disabled={busy}>
          <Avatar
            name={name || profile?.username || 'Я'}
            uri={profile?.avatar_url}
            size={84}
          />
          <Text style={styles.avatarHint}>Фото</Text>
        </Pressable>
        <View style={styles.meta}>
          <Text style={styles.phone}>{profile?.phone ?? 'Телефон не указан'}</Text>
          <Text style={styles.handle}>@{profile?.username ?? '…'}</Text>
        </View>
      </View>

      <Text style={styles.label}>Имя</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholder="Как вас видят"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>Имя пользователя</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        placeholder="username"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.section}>Конфиденциальность</Text>
      <PrivacyRow
        label="Показывать username"
        value={showUsername}
        onChange={setShowUsername}
      />
      <PrivacyRow label="Показывать фото профиля" value={showAvatar} onChange={setShowAvatar} />
      <PrivacyRow label="Показывать баннер" value={showBanner} onChange={setShowBanner} />
      <PrivacyRow label="Показывать телефон" value={showPhone} onChange={setShowPhone} />
      <PrivacyRow label="Показывать был(а) в сети" value={showLastSeen} onChange={setShowLastSeen} />
      <PrivacyRow
        label="Показывать «прочитано»"
        value={showReadReceipts}
        onChange={setShowReadReceipts}
      />

      <Text style={styles.section}>Безопасность</Text>
      <PrivacyRow
        label="Блокировать скриншоты и запись экрана"
        hint="В чатах и во время звонков. На Android экран в записи будет чёрным, на iOS содержимое скрывается."
        value={blockCapture}
        onChange={setBlockCapture}
      />
      <View style={styles.securityCard}>
        <View style={styles.securityHead}>
          <AppIcon ios="lock.shield.fill" android="shield" color={colors.accentAlt} size={20} />
          <Text style={styles.securityTitle}>Сквозное шифрование включено</Text>
        </View>
        <Text style={styles.securityText}>
          Сообщения, медиа и звонки шифруются на устройстве. Закрытый ключ хранится в защищённом хранилище телефона и
          не покидает его.
        </Text>
        {fingerprint ? (
          <>
            <Text style={styles.securityLabel}>Код безопасности этого устройства</Text>
            <Text style={styles.fingerprint}>{fingerprint}</Text>
          </>
        ) : null}
      </View>

      <Pressable style={styles.primary} onPress={() => void save()} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>Сохранить</Text>
        )}
      </Pressable>
      <Pressable style={styles.logout} onPress={() => void signOut()}>
        <Text style={styles.logoutText}>Выйти</Text>
      </Pressable>
    </ScrollView>
  );
}

function PrivacyRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.privacyRow}>
      <View style={styles.privacyText}>
        <Text style={styles.privacyLabel}>{label}</Text>
        {hint ? <Text style={styles.privacyHint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.accentMuted }}
        thumbColor={value ? colors.accentCyan : colors.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  banner: {
    height: 140,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImage: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  bannerHint: { color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  avatarRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
    marginTop: -36,
    alignItems: 'flex-end',
  },
  avatarHint: { color: colors.accent, textAlign: 'center', marginTop: 6, fontSize: 13 },
  meta: { flex: 1, paddingBottom: 8 },
  phone: { color: colors.text, fontWeight: '700', fontSize: 16 },
  handle: { color: colors.muted, marginTop: 2 },
  label: { color: colors.muted, marginBottom: 6, marginTop: 16, paddingHorizontal: 20 },
  section: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    marginTop: 28,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  input: {
    marginHorizontal: 20,
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  privacyText: { flex: 1, paddingRight: 12 },
  privacyLabel: { color: colors.text },
  privacyHint: { color: colors.muted, fontSize: 12, marginTop: 3, lineHeight: 16 },
  securityCard: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 8,
  },
  securityHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  securityTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  securityText: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  securityLabel: { color: colors.muted, fontSize: 12, marginTop: 6 },
  fingerprint: { color: colors.accentCyan, fontSize: 16, fontWeight: '700', letterSpacing: 1.2, fontVariant: ['tabular-nums'] },
  primary: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  primaryText: { color: colors.text, fontWeight: '700' },
  logout: { marginTop: 16, alignItems: 'center', padding: 14 },
  logoutText: { color: colors.danger, fontWeight: '700' },
});
