import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { Avatar } from '@/components/Avatar';
import { displayNameOf, usePublicProfile } from '@/hooks/usePublicProfile';
import { colors } from '@/lib/theme';
import { useCall } from '@/providers/CallProvider';

export function IncomingCallModal() {
  const { incoming, acceptIncoming, rejectIncoming } = useCall();
  const { profile } = usePublicProfile(incoming?.caller_id);
  const insets = useSafeAreaInsets();
  if (!incoming) return null;

  const name = displayNameOf(profile, 'Входящий вызов');
  const isVideo = incoming.kind === 'video';

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <LinearGradient colors={['#0B1C3D', colors.bg]} style={[styles.backdrop, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.top}>
          <View style={styles.kind}>
            <AppIcon ios={isVideo ? 'video.fill' : 'phone.fill'} android={isVideo ? 'videocam' : 'call'} color={colors.accentCyan} size={14} />
            <Text style={styles.kindText}>{isVideo ? 'Видеозвонок OrzuChat' : 'Аудиозвонок OrzuChat'}</Text>
          </View>
          <View style={styles.ring}>
            <Avatar name={name} uri={profile?.avatar_url} size={124} />
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {name}
          </Text>
          {profile?.username ? <Text style={styles.sub}>@{profile.username}</Text> : null}
          <View style={styles.secure}>
            <AppIcon ios="lock.fill" android="lock" color={colors.accentAlt} size={11} />
            <Text style={styles.secureText}>Сквозное шифрование</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.action}>
            <Pressable accessibilityLabel="Отклонить" style={[styles.btn, styles.reject]} onPress={() => void rejectIncoming()}>
              <AppIcon ios="phone.down.fill" android="call_end" color="#fff" size={28} />
            </Pressable>
            <Text style={styles.btnLabel}>Отклонить</Text>
          </View>
          <View style={styles.action}>
            <Pressable accessibilityLabel="Ответить" style={[styles.btn, styles.accept]} onPress={() => void acceptIncoming()}>
              <AppIcon ios={isVideo ? 'video.fill' : 'phone.fill'} android={isVideo ? 'videocam' : 'call'} color="#fff" size={28} />
            </Pressable>
            <Text style={styles.btnLabel}>Ответить</Text>
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24 },
  top: { alignItems: 'center', gap: 10 },
  kind: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  kindText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  ring: { padding: 6, borderRadius: 999, borderWidth: 3, borderColor: 'rgba(18,194,247,0.45)' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 8 },
  sub: { color: colors.muted, fontSize: 15 },
  secure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,214,154,0.12)',
  },
  secureText: { color: colors.accentAlt, fontSize: 11, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 64 },
  action: { alignItems: 'center', gap: 10 },
  btn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  reject: { backgroundColor: colors.danger },
  accept: { backgroundColor: colors.accentAlt },
  btnLabel: { color: colors.text, fontWeight: '600', fontSize: 13 },
});
