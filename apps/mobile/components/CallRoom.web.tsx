import { createElement, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Room, RoomEvent, Track } from 'livekit-client';

import { CallControls, CallHeader, CallPeerPlaceholder } from '@/components/CallUi';
import type { CallRoomProps } from '@/components/CallRoom';
import { colors } from '@/lib/theme';

function MediaEl({
  kind,
  stream,
  muted,
  style,
}: {
  kind: 'video' | 'audio';
  stream: MediaStream | null;
  muted?: boolean;
  style?: Record<string, string | number>;
}) {
  return createElement(kind, {
    autoPlay: true,
    playsInline: true,
    muted: Boolean(muted),
    style,
    ref: (node: HTMLMediaElement | null) => {
      if (node) {
        node.srcObject = stream;
      }
    },
  });
}

/**
 * Web fallback. Browsers get transport encryption (DTLS-SRTP) only:
 * frame-level E2EE needs a bundled worker that Metro web does not provide,
 * so calls between web and an E2EE mobile client are not supported.
 */
export function CallRoom({ serverUrl, token, video, peerName, peerAvatar, onHangup }: CallRoomProps) {
  const [status, setStatus] = useState('Подключение…');
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(!video);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteVideo, setRemoteVideo] = useState<MediaStream | null>(null);
  const [remoteAudio, setRemoteAudio] = useState<MediaStream | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const next = new Room({ adaptiveStream: true, dynacast: true });
    setRoom(next);
    setStatus('Соединение…');

    const fromTrack = (track: Track) => new MediaStream([track.mediaStreamTrack]);

    next.on(RoomEvent.LocalTrackPublished, (pub) => {
      if (pub.track && pub.source === Track.Source.Camera) {
        setLocalStream(fromTrack(pub.track));
      }
    });
    next.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Video) setRemoteVideo(fromTrack(track));
      if (track.kind === Track.Kind.Audio) setRemoteAudio(fromTrack(track));
      setStatus('В разговоре');
    });
    next.on(RoomEvent.ParticipantDisconnected, () => setStatus('Собеседник вышел'));
    next.on(RoomEvent.Disconnected, () => setStatus('Звонок завершён'));

    void next
      .connect(serverUrl, token)
      .then(async () => {
        setStatus('Ожидание ответа…');
        await next.localParticipant.setMicrophoneEnabled(true);
        await next.localParticipant.setCameraEnabled(video);
      })
      .catch((error: unknown) => {
        setStatus(error instanceof Error ? error.message : 'Не удалось подключиться');
      });

    return () => {
      void next.disconnect();
    };
  }, [serverUrl, token, video]);

  return (
    <View style={styles.room}>
      {video && remoteVideo ? (
        <View style={styles.remote}>
          <MediaEl kind="video" stream={remoteVideo} style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} />
        </View>
      ) : (
        <CallPeerPlaceholder name={peerName} avatar={peerAvatar} speaking={Boolean(remoteAudio)} />
      )}
      {video && localStream && !camOff ? (
        <View style={styles.local}>
          <MediaEl kind="video" stream={localStream} muted style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} />
        </View>
      ) : null}
      <MediaEl kind="audio" stream={remoteAudio} />
      <CallHeader name={peerName} status={status} encrypted={false} />
      <CallControls
        video={video}
        muted={muted}
        camOff={camOff}
        onToggleMic={() => {
          const nextMuted = !muted;
          setMuted(nextMuted);
          void room?.localParticipant.setMicrophoneEnabled(!nextMuted);
        }}
        onToggleCam={() => {
          const nextCamOff = !camOff;
          setCamOff(nextCamOff);
          void room?.localParticipant.setCameraEnabled(!nextCamOff);
        }}
        onHangup={onHangup}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  room: { flex: 1, backgroundColor: colors.bg },
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
});
