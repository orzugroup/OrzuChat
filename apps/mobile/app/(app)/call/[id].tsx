import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CallRoom } from '@/components/CallRoom';
import { displayNameOf, usePublicProfile } from '@/hooks/usePublicProfile';
import { useScreenProtection } from '@/hooks/useScreenProtection';
import { useSharedKey } from '@/hooks/useSharedKey';
import { api } from '@/lib/api';
import { deriveCallKey } from '@/lib/crypto/e2e';
import { colors } from '@/lib/theme';
import type { CallSession } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useCall } from '@/providers/CallProvider';

export default function CallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session: auth, screenProtection } = useAuth();
  const { active, hangup } = useCall();
  const [session, setSession] = useState<CallSession | null>(active?.call.id === id ? active : null);
  const [error, setError] = useState<string | null>(null);

  useScreenProtection(screenProtection, `call-${id ?? 'none'}`);

  useEffect(() => {
    if (!id || session) return;
    api
      .getCall(id)
      .then(setSession)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Ошибка звонка'));
  }, [id, session]);

  const myId = auth?.user.id;
  const peerId = session ? (session.call.caller_id === myId ? session.call.callee_id : session.call.caller_id) : null;
  const { profile: peer } = usePublicProfile(peerId);
  const shared = useSharedKey(peerId);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.close} onPress={() => void hangup()}>
          <Text style={styles.closeText}>Закрыть</Text>
        </Pressable>
      </View>
    );
  }

  if (!session || !shared.resolved) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.muted}>{session ? 'Согласование ключей…' : 'Соединение…'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CallRoom
        serverUrl={session.livekit_url}
        token={session.token}
        video={session.call.kind === 'video'}
        callKey={shared.key ? deriveCallKey(shared.key, session.call.id) : null}
        peerName={displayNameOf(peer, 'Собеседник')}
        peerAvatar={peer?.avatar_url ?? null}
        onHangup={() => void hangup()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  muted: { color: colors.muted },
  error: { color: colors.danger, padding: 24, textAlign: 'center' },
  close: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
  },
  closeText: { color: colors.text, fontWeight: '800' },
});
