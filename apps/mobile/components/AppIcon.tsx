import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';

type SfName = Extract<ComponentProps<typeof SymbolView>['name'], string>;
type MdName =
  | 'attach_file'
  | 'call'
  | 'call_end'
  | 'cameraswitch'
  | 'chat'
  | 'description'
  | 'lock'
  | 'mic'
  | 'mic_off'
  | 'pause'
  | 'person'
  | 'person_add'
  | 'photo'
  | 'photo_camera'
  | 'play_arrow'
  | 'play_circle'
  | 'search'
  | 'send'
  | 'settings'
  | 'shield'
  | 'stop'
  | 'videocam'
  | 'videocam_off'
  | 'visibility'
  | 'volume_up';

type Props = {
  ios: SfName;
  android: MdName;
  color: string;
  size?: number;
};

export function AppIcon({ ios, android, color, size = 22 }: Props) {
  return (
    <SymbolView name={{ ios, android, web: android }} tintColor={color} size={size} />
  );
}
