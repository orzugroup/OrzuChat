import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { showAlert } from '@/lib/alert';
import { formatDuration } from '@/lib/format';
import type { MediaPayload } from '@/lib/media';
import { actionColors, colors } from '@/lib/theme';

type Props = {
  onSendText: (text: string) => Promise<void>;
  onSendMedia: (input: MediaPayload) => Promise<void>;
};

type AttachKind = 'photo' | 'video' | 'camera' | 'file';

const ATTACH_ACTIONS: {
  kind: AttachKind;
  ios: Parameters<typeof AppIcon>[0]['ios'];
  android: Parameters<typeof AppIcon>[0]['android'];
  color: string;
  label: string;
}[] = [
  { kind: 'camera', ios: 'camera.fill', android: 'photo_camera', color: actionColors.camera, label: 'Камера' },
  { kind: 'photo', ios: 'photo', android: 'photo', color: actionColors.photo, label: 'Фото' },
  { kind: 'video', ios: 'video.fill', android: 'videocam', color: actionColors.video, label: 'Видео' },
  { kind: 'file', ios: 'doc.fill', android: 'description', color: actionColors.file, label: 'Файл' },
];

export function Composer({ onSendText, onSendMedia }: Props) {
  const [text, setText] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const recording = recorderState.isRecording;
  const hasText = text.trim().length > 0;

  const sendText = async () => {
    const value = text.trim();
    if (!value || busy) return;
    setText('');
    setAttachOpen(false);
    Keyboard.dismiss();
    setBusy(true);
    try {
      await onSendText(value);
    } finally {
      setBusy(false);
    }
  };

  const sendMedia = async (payload: MediaPayload) => {
    setAttachOpen(false);
    Keyboard.dismiss();
    setBusy(true);
    try {
      await onSendMedia(payload);
    } finally {
      setBusy(false);
    }
  };

  const ensureLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Нужна галерея', 'Разрешите доступ к фото и видео.');
      return false;
    }
    return true;
  };

  const pickFromLibrary = async (kind: 'photo' | 'video') => {
    if (!(await ensureLibrary())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === 'video' ? ['videos'] : ['images'],
      quality: 0.85,
      videoMaxDuration: 60,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const isVideo = (asset.type ?? kind) === 'video' || (asset.mimeType ?? '').startsWith('video/');
    await sendMedia({
      uri: asset.uri,
      mime: asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
      name: asset.fileName ?? (isVideo ? 'video.mp4' : 'photo.jpg'),
      type: isVideo ? 'video' : 'image',
      durationMs: asset.duration ? Math.round(asset.duration * 1000) : undefined,
    });
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showAlert('Нужна камера', 'Разрешите доступ к камере.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await sendMedia({
      uri: asset.uri,
      mime: asset.mimeType ?? 'image/jpeg',
      name: asset.fileName ?? 'camera.jpg',
      type: 'image',
    });
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await sendMedia({
      uri: asset.uri,
      mime: asset.mimeType ?? 'application/octet-stream',
      name: asset.name,
      type: 'file',
    });
  };

  const onAttach = (kind: AttachKind) => {
    if (busy || recording) return;
    if (kind === 'photo') void pickFromLibrary('photo');
    if (kind === 'video') void pickFromLibrary('video');
    if (kind === 'camera') void takePhoto();
    if (kind === 'file') void pickFile();
  };

  const toggleVoice = async () => {
    if (busy) return;
    setAttachOpen(false);
    try {
      if (recording) {
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
        });
        if (!uri) return;
        await sendMedia({
          uri,
          mime: 'audio/m4a',
          name: 'voice.m4a',
          type: 'voice',
          durationMs: recorderState.durationMillis,
        });
        return;
      }
      Keyboard.dismiss();
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        showAlert('Нужен микрофон', 'Разрешите доступ к микрофону для голосовых.');
        return;
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      showAlert('Запись', error instanceof Error ? error.message : 'Не удалось записать');
    }
  };

  return (
    <View style={styles.wrap}>
      {attachOpen ? (
        <View style={styles.sheet}>
          {ATTACH_ACTIONS.map((item) => (
            <Pressable
              key={item.kind}
              accessibilityLabel={item.label}
              onPress={() => onAttach(item.kind)}
              style={styles.attachItem}
            >
              <View style={[styles.attachCircle, { backgroundColor: item.color }]}>
                <AppIcon ios={item.ios} android={item.android} color="#fff" size={22} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.bar}>
        {recording ? (
          <View style={[styles.inputWrap, styles.recordingWrap]}>
            <View style={styles.recDot} />
            <Text style={styles.recText}>Запись {formatDuration(recorderState.durationMillis)}</Text>
            <Pressable
              accessibilityLabel="Остановить запись"
              style={[styles.action, styles.actionRec]}
              onPress={() => void toggleVoice()}
            >
              <AppIcon ios="stop.fill" android="stop" color="#fff" size={16} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.inputWrap}>
            <Pressable
              accessibilityLabel="Вложения"
              hitSlop={6}
              disabled={busy}
              onPress={() => {
                Keyboard.dismiss();
                setAttachOpen((open) => !open);
              }}
              style={styles.attachBtn}
            >
              <View style={[styles.attachIcon, attachOpen && styles.attachIconOpen]}>
                <AppIcon ios="paperclip" android="attach_file" color={colors.muted} size={22} />
              </View>
            </Pressable>
            <TextInput
              value={text}
              onChangeText={(value) => {
                setText(value);
                if (attachOpen) setAttachOpen(false);
              }}
              placeholder="Сообщение"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
              editable={!busy}
            />
            {busy ? (
              <View style={styles.action}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            ) : hasText ? (
              <Pressable accessibilityLabel="Отправить" style={styles.action} onPress={() => void sendText()}>
                <AppIcon ios="paperplane.fill" android="send" color="#fff" size={16} />
              </Pressable>
            ) : (
              <Pressable
                accessibilityLabel="Голосовое сообщение"
                style={styles.action}
                onPress={() => void toggleVoice()}
              >
                <AppIcon ios="mic.fill" android="mic" color="#fff" size={18} />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'transparent',
  },
  sheet: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  attachItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 8,
    paddingRight: 4,
    paddingTop: 6,
  },
  attachBtn: { paddingLeft: 10, paddingRight: 2, paddingBottom: 8 },
  attachIcon: { transform: [{ rotate: '-45deg' }] },
  attachIconOpen: { transform: [{ rotate: '90deg' }] },
  inputWrap: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingRight: 4,
    paddingBottom: 3,
  },
  input: {
    flex: 1,
    color: colors.text,
    paddingRight: 6,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    maxHeight: 120,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, marginLeft: 14 },
  recText: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 10,
    paddingLeft: 8,
  },
  recordingWrap: { alignItems: 'center' },
  action: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 1,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRec: { backgroundColor: colors.danger },
});
