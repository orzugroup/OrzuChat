import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioPlayer,
} from 'expo-audio';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDuration } from '@/lib/format';
import { colors } from '@/lib/theme';

let activePlayer: AudioPlayer | null = null;

type Props = {
  uri: string | null;
  durationMs?: number | null;
};

export function VoiceNote({ uri, durationMs }: Props) {
  const player = useAudioPlayer(null, { updateInterval: 200, downloadFirst: true });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (uri) player.replace({ uri });
  }, [player, uri]);

  useEffect(() => {
    if (status.didJustFinish) {
      void player.seekTo(0);
      if (activePlayer === player) activePlayer = null;
    }
  }, [player, status.didJustFinish]);

  useEffect(() => {
    return () => {
      if (activePlayer === player) activePlayer = null;
      try {
        player.pause();
      } catch {
        // player already released by useAudioPlayer cleanup
      }
    };
  }, [player]);

  const totalMs =
    status.duration > 0 ? Math.round(status.duration * 1000) : (durationMs ?? 0);
  const currentMs = Math.round(status.currentTime * 1000);
  const progress = totalMs > 0 ? Math.min(1, currentMs / totalMs) : 0;
  const labelMs = status.playing ? currentMs : totalMs;

  const toggle = async () => {
    if (!uri) return;
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    if (status.playing) {
      player.pause();
      if (activePlayer === player) activePlayer = null;
      return;
    }
    if (activePlayer && activePlayer !== player) {
      activePlayer.pause();
    }
    if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.05)) {
      await player.seekTo(0);
    }
    activePlayer = player;
    player.play();
  };

  return (
    <Pressable
      accessibilityLabel={status.playing ? 'Пауза' : 'Слушать голосовое'}
      onPress={() => void toggle()}
      style={styles.row}
    >
      <View style={styles.play}>
        <SymbolView
          name={{
            ios: status.playing ? 'pause.fill' : 'play.fill',
            android: status.playing ? 'pause' : 'play_arrow',
            web: status.playing ? 'pause' : 'play_arrow',
          }}
          tintColor={colors.text}
          size={18}
        />
      </View>
      <View style={styles.meta}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(6, progress * 100)}%` }]} />
        </View>
        <Text style={styles.time}>{formatDuration(labelMs)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 168, paddingVertical: 2 },
  play: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1, gap: 6 },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.text },
  time: { color: colors.muted, fontSize: 12, fontWeight: '600' },
});
