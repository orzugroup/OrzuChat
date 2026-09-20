import * as Clipboard from 'expo-clipboard';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { SettingsSection } from '@/components/SettingsRow';
import { usePushState, useRetryPushRegistration } from '@/hooks/usePushRegistration';
import { t } from '@/lib/i18n';
import { showAlert } from '@/lib/alert';
import { presentTestNotification } from '@/lib/notifications';
import { RINGTONES, selectedRingtoneId, setSelectedRingtone, subscribeRingtone, type RingtoneId } from '@/lib/ringtones';
import type { Palette } from '@/lib/theme';
import { useStyles, useTheme } from '@/providers/ThemeProvider';

export default function NotificationsScreen() {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const state = usePushState();
  const retry = useRetryPushRegistration();
  const [busy, setBusy] = useState(false);
  const [previewId, setPreviewId] = useState<RingtoneId | null>(null);
  const selectedTone = useSyncExternalStore(subscribeRingtone, selectedRingtoneId, selectedRingtoneId);

  const ok = state.stage === 'ready' && state.permission === 'granted';
  const statusLabel = ok
    ? t('notif.stateReady')
    : state.permission === 'denied'
      ? t('notif.fixPermission')
      : state.stage === 'working'
        ? t('notif.stateWorking')
        : t('notif.stateIdle');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.hero, ok ? styles.heroOk : styles.heroBad]}>
        <AppIcon
          ios={ok ? 'bell.fill' : 'bell.slash.fill'}
          android={ok ? 'notifications' : 'notifications_off'}
          color={ok ? colors.accentAlt : colors.warning}
          size={30}
        />
        <Text style={styles.heroTitle}>{ok ? t('notif.stateReady') : t('notif.title')}</Text>
        <Text style={styles.heroText}>{statusLabel}</Text>
      </View>

      <SettingsSection title={t('notif.ringtone')} style={styles.block}>
        {RINGTONES.map((tone) => {
          const active = tone.id === selectedTone;
          return (
            <Pressable
              key={tone.id}
              style={({ pressed }) => [styles.toneRow, pressed && styles.pressed]}
              onPress={() => void setSelectedRingtone(tone.id)}
            >
              <AppIcon
                ios={active ? 'checkmark.circle.fill' : 'circle'}
                android={active ? 'check_circle' : 'radio_button_unchecked'}
                color={active ? colors.accent : colors.muted}
                size={22}
              />
              <Text style={[styles.toneLabel, active && styles.toneActive]}>{t(tone.labelKey)}</Text>
              <Pressable
                accessibilityLabel={t('notif.ringtonePreview')}
                hitSlop={8}
                onPress={() => setPreviewId((current) => (current === tone.id ? null : tone.id))}
                style={styles.previewBtn}
              >
                <AppIcon
                  ios={previewId === tone.id ? 'stop.fill' : 'play.fill'}
                  android={previewId === tone.id ? 'stop' : 'play_arrow'}
                  color={colors.accent}
                  size={18}
                />
              </Pressable>
            </Pressable>
          );
        })}
      </SettingsSection>
      {previewId ? <RingtonePreview source={RINGTONES.find((item) => item.id === previewId)?.source ?? RINGTONES[0].source} /> : null}

      {!ok ? (
        <Pressable
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          onPress={() => {
            setBusy(true);
            void retry().finally(() => setBusy(false));
          }}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color={colors.onAccent} /> : <Text style={styles.primaryText}>{t('notif.retry')}</Text>}
        </Pressable>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.primary, !ok && styles.secondaryLike, pressed && styles.pressed]}
        onPress={() => {
          setBusy(true);
          void presentTestNotification().finally(() => setBusy(false));
        }}
        disabled={busy}
      >
        {busy ? <ActivityIndicator color={colors.onAccent} /> : <Text style={styles.primaryText}>{t('notif.sendTest')}</Text>}
      </Pressable>

      {state.token ? (
        <SettingsSection title={t('notif.token')} style={styles.block}>
          <Text selectable style={styles.token}>
            {state.token}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]}
            onPress={() => {
              void Clipboard.setStringAsync(state.token ?? '').then(() => showAlert(t('notif.token'), t('common.copied')));
            }}
          >
            <Text style={styles.copyText}>{t('notif.copyToken')}</Text>
          </Pressable>
        </SettingsSection>
      ) : null}

      {Platform.OS === 'android' ? (
        <Pressable
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          onPress={() => {
            void (async () => {
              try {
                await Linking.sendIntent('android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT');
              } catch {
                await Linking.openSettings();
              }
            })();
          }}
        >
          <Text style={styles.secondaryText}>{t('notif.fullScreen')}</Text>
        </Pressable>
      ) : null}

      <Pressable style={({ pressed }) => [styles.secondary, pressed && styles.pressed]} onPress={() => void Linking.openSettings()}>
        <Text style={styles.secondaryText}>{t('notif.openSystem')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 16, paddingBottom: 40 },
    hero: {
      marginHorizontal: 16,
      padding: 18,
      borderRadius: 18,
      alignItems: 'center',
      gap: 8,
      borderWidth: StyleSheet.hairlineWidth,
    },
    heroOk: { backgroundColor: colors.accentMuted, borderColor: colors.accentAlt },
    heroBad: { backgroundColor: colors.card, borderColor: colors.border },
    heroTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
    heroText: { color: colors.muted, textAlign: 'center', lineHeight: 20 },
    block: { marginTop: 22 },
    primary: {
      marginTop: 24,
      marginHorizontal: 16,
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
    },
    primaryText: { color: colors.onAccent, fontWeight: '800', fontSize: 16 },
    secondaryLike: { marginTop: 10 },
    secondary: { marginTop: 10, marginHorizontal: 16, paddingVertical: 14, alignItems: 'center' },
    secondaryText: { color: colors.accent, fontWeight: '600', fontSize: 15 },
    pressed: { opacity: 0.85 },
    toneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    toneLabel: { flex: 1, color: colors.text, fontSize: 16 },
    toneActive: { fontWeight: '700' },
    previewBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    token: { color: colors.muted, fontSize: 12, lineHeight: 18, paddingHorizontal: 16, paddingTop: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    copyBtn: { paddingHorizontal: 16, paddingVertical: 12 },
    copyText: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  });

function RingtonePreview({ source }: { source: number }) {
  const player = useAudioPlayer(source);
  useEffect(() => {
    void (async () => {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
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
    };
  }, [player]);
  return null;
}
