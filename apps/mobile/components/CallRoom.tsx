import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Track, type LocalVideoTrack } from 'livekit-client';

import { CallControls, CallHeader, CallPeerPlaceholder } from '@/components/CallUi';
import { colors } from '@/lib/theme';

type Native = typeof import('@livekit/react-native');

export type CallRoomProps = {
  serverUrl: string;
  token: string;
  video: boolean;
  /** Base64 E2EE media key shared with the peer; null = transport encryption only. */
  callKey: string | null;
  peerName: string;
  peerAvatar: string | null;
  onHangup: () => void;
};

export function CallRoom(props: CallRoomProps) {
  const [ready, setReady] = useState(false);
  const [native, setNative] = useState<Native | null>(null);

  useEffect(() => {
    if (Constants.appOwnership === 'expo') {
      setReady(true);
      return;
    }
    let cancelled = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('@livekit/react-native') as Native;
      if (!cancelled) {
        setNative(mod);
        void mod.AudioSession.startAudioSession().then(() => {
          if (!cancelled) setReady(true);
        });
      }
    } catch {
      if (!cancelled) setReady(true);
    }
    return () => {
      cancelled = true;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require('@livekit/react-native') as Native;
        void mod.AudioSession.stopAudioSession();
      } catch {
        // Expo Go
      }
    };
  }, []);

  if (!native || !ready) {
    return (
      <View style={styles.fallback}>
        <CallHeader
          name={props.peerName}
          status={
            Constants.appOwnership === 'expo'
              ? 'В Expo Go звонки недоступны — соберите APK / development build.'
              : native
                ? 'Подключение…'
                : 'Нужен EAS development build для WebRTC-звонка.'
          }
          encrypted={Boolean(props.callKey)}
        />
        <CallPeerPlaceholder name={props.peerName} avatar={props.peerAvatar} />
        <CallControls video={false} muted={false} camOff onToggleMic={() => undefined} onToggleCam={() => undefined} onHangup={props.onHangup} />
      </View>
    );
  }

  return props.callKey ? (
    <EncryptedRoom native={native} {...props} callKey={props.callKey} />
  ) : (
    <PlainRoom native={native} {...props} />
  );
}

type RoomProps = CallRoomProps & { native: Native };

function EncryptedRoom({ native, callKey, ...props }: RoomProps & { callKey: string }) {
  const { e2eeManager } = native.useRNE2EEManager({ sharedKey: callKey });
  return (
    <native.LiveKitRoom
      serverUrl={props.serverUrl}
      token={props.token}
      connect
      audio
      video={props.video}
      options={{ adaptiveStream: true, dynacast: true, e2ee: { e2eeManager } }}
    >
      <RoomView native={native} {...props} encrypted />
    </native.LiveKitRoom>
  );
}

function PlainRoom({ native, ...props }: RoomProps) {
  return (
    <native.LiveKitRoom
      serverUrl={props.serverUrl}
      token={props.token}
      connect
      audio
      video={props.video}
      options={{ adaptiveStream: true, dynacast: true }}
    >
      <RoomView native={native} {...props} encrypted={false} />
    </native.LiveKitRoom>
  );
}

function RoomView({
  native,
  video,
  peerName,
  peerAvatar,
  encrypted,
  onHangup,
}: Omit<RoomProps, 'callKey' | 'serverUrl' | 'token'> & { encrypted: boolean }) {
  const { useTracks, VideoTrack, isTrackReference, useLocalParticipant, useConnectionState, useRemoteParticipants } =
    native;
  const tracks = useTracks(video ? [Track.Source.Camera] : []);
  const { localParticipant } = useLocalParticipant();
  const connection = useConnectionState();
  const remotes = useRemoteParticipants();
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(!video);
  const [facingFront, setFacingFront] = useState(true);
  const [seconds, setSeconds] = useState(0);

  const peerJoined = remotes.length > 0;

  useEffect(() => {
    if (!peerJoined) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [peerJoined]);

  const remoteTrack = tracks.find((item) => isTrackReference(item) && !item.participant.isLocal);
  const localTrack = tracks.find((item) => isTrackReference(item) && item.participant.isLocal);

  const status =
    connection === 'connecting'
      ? 'Соединение…'
      : connection === 'reconnecting'
        ? 'Переподключение…'
        : connection === 'disconnected'
          ? 'Звонок завершён'
          : peerJoined
            ? formatSeconds(seconds)
            : 'Ожидание ответа…';

  const flipCamera = async () => {
    const publication = localParticipant.getTrackPublication(Track.Source.Camera);
    const track = publication?.track as LocalVideoTrack | undefined;
    if (!track) return;
    const next = !facingFront;
    try {
      await track.restartTrack({ facingMode: next ? 'user' : 'environment' });
      setFacingFront(next);
    } catch {
      // camera switch unsupported on this device
    }
  };

  return (
    <View style={styles.room}>
      {video && remoteTrack && isTrackReference(remoteTrack) ? (
        <VideoTrack trackRef={remoteTrack} style={styles.remote} objectFit="cover" />
      ) : (
        <CallPeerPlaceholder name={peerName} avatar={peerAvatar} speaking={peerJoined} />
      )}

      <CallHeader name={peerName} status={status} encrypted={encrypted} />

      {video && localTrack && isTrackReference(localTrack) && !camOff ? (
        <View style={styles.local}>
          <VideoTrack trackRef={localTrack} style={styles.localVideo} objectFit="cover" mirror={facingFront} zOrder={1} />
        </View>
      ) : null}

      <CallControls
        video={video}
        muted={muted}
        camOff={camOff}
        onToggleMic={() => {
          const next = !muted;
          setMuted(next);
          void localParticipant.setMicrophoneEnabled(!next);
        }}
        onToggleCam={() => {
          const next = !camOff;
          setCamOff(next);
          void localParticipant.setCameraEnabled(!next);
        }}
        onFlipCamera={video ? () => void flipCamera() : undefined}
        onHangup={onHangup}
      />
    </View>
  );
}

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  room: { flex: 1, backgroundColor: colors.bg },
  fallback: { flex: 1, backgroundColor: colors.bg },
  remote: { ...StyleSheet.absoluteFill, backgroundColor: '#000' },
  local: {
    position: 'absolute',
    right: 16,
    top: 120,
    width: 112,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  localVideo: { flex: 1 },
});
