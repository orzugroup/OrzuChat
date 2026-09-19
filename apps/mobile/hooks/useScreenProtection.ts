import * as ScreenCapture from 'expo-screen-capture';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Blocks screenshots and screen recording while the calling screen is mounted.
 * Android: FLAG_SECURE (black frame in recordings, screenshots refused).
 * iOS: secure-field overlay hides content in screenshots/recordings (iOS 13+).
 * Web: not supported by browsers — no-op.
 */
export function useScreenProtection(enabled: boolean, key: string): void {
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    ScreenCapture.preventScreenCaptureAsync(key).catch(() => undefined);
    return () => {
      ScreenCapture.allowScreenCaptureAsync(key).catch(() => undefined);
    };
  }, [enabled, key]);
}

/** iOS-only: blur the app preview in the app switcher so chats are not exposed. */
export async function setAppSwitcherProtection(enabled: boolean): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    if (enabled) await ScreenCapture.enableAppSwitcherProtectionAsync();
    else await ScreenCapture.disableAppSwitcherProtectionAsync();
  } catch {
    // unsupported in this runtime
  }
}
