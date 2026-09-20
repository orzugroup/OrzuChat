import { LinearGradient } from 'expo-linear-gradient';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { Avatar } from '@/components/Avatar';
import { displayNameOf, usePublicProfile } from '@/hooks/usePublicProfile';
import { t } from '@/lib/i18n';
import { selectedRingtone, subscribeRingtone } from '@/lib/ringtones';
import { darkPalette, gradients } from '@/lib/theme';
import { useCall } from '@/providers/CallProvider';

const c = darkPalette;

/**
 * Full-screen incoming call UI. Rendered as an in-window overlay (not RN `Modal`)
 * so FLAG_SECURE keeps it out of screen recordings. Plays the selected looping
 * ringtone until the user answers or declines.
 */
export function IncomingCallOverlay() {
  const { incoming } = useCall();
  const pulse = useRef(new Animated.Value(1)).current;
  const tone = useSyncExternalStore(subscribeRingtone, selectedRingtone, selectedRingtone);
  if (!incoming) return null;
  return (
    <>
      <IncomingRingtone key={tone.id} source={tone.source} />
      <IncomingCallUi pulse={pulse} />
    </>
  );
}

function IncomingRingtone({ source }: { source: number }) {
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    void activateKeepAwakeAsync('incoming-call');
    void (async () => {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      try {
        player.loop = true;
      } catch {
        // older expo-audio
      }
      player.volume = 1;
      await player.seekTo(0);
      player.play();
    })();
    return () => {
      try {
        player.pause();
      } catch {
        // released
      }
      void deactivateKeepAwake('incoming-call');
    };
  }, [player]);

  useEffect(() => {
    if (!status.didJustFinish) return;
    void player.seekTo(0).then(() => player.play());
  }, [player, status.didJustFinish]);

  return null;
}

function IncomingCallUi({ pulse }: { pulse: Animated.Value }) {
  const { incoming, acceptIncoming, rejectIncoming } = useCall();
  const { profile } = usePublicProfile(incoming?.caller_id);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!incoming) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [incoming, pulse]);

  if (!incoming) return null;

  const name =
    incoming.caller_id === 'script' ? 'OrzuChat' : displayNameOf(profile, t('call.incoming'));
  const isVideo = incoming.kind === 'video';

  return (
    <View style={styles.overlay}>
      <LinearGradient colors={[...gradients.call]} style={[styles.backdrop, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.top}>
          <View style={styles.kind}>
            <AppIcon ios={isVideo ? 'video.fill' : 'phone.fill'} android={isVideo ? 'videocam' : 'call'} color={c.accentCyan} size={14} />
            <Text style={styles.kindText}>{isVideo ? t('call.incomingVideo') : t('call.incomingAudio')}</Text>
          </View>
          <Animated.View style={[styles.ring, { transform: [{ scale: pulse }] }]}>
            <Avatar name={name} uri={profile?.avatar_url} size={124} />
          </Animated.View>
          <Text style={styles.title} numberOfLines={1}>
            {name}
          </Text>
          {profile?.username ? <Text style={styles.sub}>@{profile.username}</Text> : null}
          <View style={styles.secure}>
            <AppIcon ios="lock.fill" android="lock" color={c.accentAlt} size={11} />
            <Text style={styles.secureText}>{t('chat.encrypted')}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.action}>
            <Pressable accessibilityLabel={t('call.decline')} style={({ pressed }) => [styles.btn, styles.reject, pressed && styles.pressed]} onPress={() => void rejectIncoming()}>
              <AppIcon ios="phone.down.fill" android="call_end" color="#fff" size={28} />
            </Pressable>
            <Text style={styles.btnLabel}>{t('call.decline')}</Text>
          </View>
          <View style={styles.action}>
            <Pressable accessibilityLabel={t('call.answer')} style={({ pressed }) => [styles.btn, styles.accept, pressed && styles.pressed]} onPress={() => void acceptIncoming()}>
              <AppIcon ios={isVideo ? 'video.fill' : 'phone.fill'} android={isVideo ? 'videocam' : 'call'} color="#fff" size={28} />
            </Pressable>
            <Text style={styles.btnLabel}>{t('call.answer')}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 950, elevation: 950 },
  backdrop: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24 },
  top: { alignItems: 'center', gap: 10 },
  kind: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  kindText: { color: c.muted, fontWeight: '600', fontSize: 13 },
  ring: { padding: 6, borderRadius: 999, borderWidth: 3, borderColor: 'rgba(18,194,247,0.45)' },
  title: { color: c.text, fontSize: 28, fontWeight: '800', marginTop: 8 },
  sub: { color: c.muted, fontSize: 15 },
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
  secureText: { color: c.accentAlt, fontSize: 11, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 64 },
  action: { alignItems: 'center', gap: 10 },
  btn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  reject: { backgroundColor: c.danger },
  accept: { backgroundColor: c.accentAlt },
  pressed: { opacity: 0.85 },
  btnLabel: { color: c.text, fontWeight: '600', fontSize: 13 },
});
