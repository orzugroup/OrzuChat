import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { Avatar } from '@/components/Avatar';
import { colors } from '@/lib/theme';

/** Shared, platform-independent pieces of the call screen. */

export function CallHeader({ name, status, encrypted }: { name: string; status: string; encrypted: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={[styles.badge, encrypted ? styles.badgeSecure : styles.badgePlain]}>
        <AppIcon
          ios={encrypted ? 'lock.fill' : 'lock.open.fill'}
          android="lock"
          color={encrypted ? colors.accentAlt : colors.warning}
          size={11}
        />
        <Text style={[styles.badgeText, { color: encrypted ? colors.accentAlt : colors.warning }]}>
          {encrypted ? 'Сквозное шифрование' : 'Защищённое соединение'}
        </Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

export function CallPeerPlaceholder({
  name,
  avatar,
  speaking,
}: {
  name: string;
  avatar: string | null;
  speaking?: boolean;
}) {
  return (
    <LinearGradient colors={['#0B1C3D', colors.bg]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.placeholder}>
      <View style={[styles.ring, speaking && styles.ringActive]}>
        <Avatar name={name} uri={avatar} size={132} />
      </View>
    </LinearGradient>
  );
}

type ControlsProps = {
  video: boolean;
  muted: boolean;
  camOff: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onFlipCamera?: () => void;
  onHangup: () => void;
};

export function CallControls({ video, muted, camOff, onToggleMic, onToggleCam, onFlipCamera, onHangup }: ControlsProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.controls, { paddingBottom: insets.bottom + 28 }]}>
      <ControlButton
        label={muted ? 'Микрофон выкл' : 'Микрофон'}
        active={muted}
        onPress={onToggleMic}
        ios={muted ? 'mic.slash.fill' : 'mic.fill'}
        android={muted ? 'mic_off' : 'mic'}
      />
      {video ? (
        <ControlButton
          label={camOff ? 'Камера выкл' : 'Камера'}
          active={camOff}
          onPress={onToggleCam}
          ios={camOff ? 'video.slash.fill' : 'video.fill'}
          android={camOff ? 'videocam_off' : 'videocam'}
        />
      ) : null}
      {video && onFlipCamera ? (
        <ControlButton label="Перевернуть" onPress={onFlipCamera} ios="arrow.triangle.2.circlepath.camera.fill" android="cameraswitch" />
      ) : null}
      <Pressable accessibilityLabel="Завершить" onPress={onHangup} style={({ pressed }) => [styles.hangup, pressed && styles.pressed]}>
        <AppIcon ios="phone.down.fill" android="call_end" color="#fff" size={28} />
      </Pressable>
    </View>
  );
}

function ControlButton({
  label,
  active,
  onPress,
  ios,
  android,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  ios: Parameters<typeof AppIcon>[0]['ios'];
  android: Parameters<typeof AppIcon>[0]['android'];
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.control, active && styles.controlActive, pressed && styles.pressed]}
    >
      <AppIcon ios={ios} android={android} color={active ? colors.bg : '#fff'} size={24} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    pointerEvents: 'none',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeSecure: { backgroundColor: 'rgba(0,214,154,0.12)', borderColor: 'rgba(0,214,154,0.35)' },
  badgePlain: { backgroundColor: 'rgba(255,180,84,0.12)', borderColor: 'rgba(255,180,84,0.35)' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  name: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 6 },
  status: { color: 'rgba(255,255,255,0.75)', fontSize: 15, fontVariant: ['tabular-nums'] },
  placeholder: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  ring: { padding: 6, borderRadius: 999, borderWidth: 3, borderColor: 'rgba(255,255,255,0.12)' },
  ringActive: { borderColor: colors.accentAlt },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 24,
  },
  control: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlActive: { backgroundColor: '#fff' },
  hangup: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
});
