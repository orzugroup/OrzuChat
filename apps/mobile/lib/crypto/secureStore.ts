import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Small wrapper over the OS keychain (iOS Keychain / Android Keystore).
 * On web there is no secure enclave, so values fall back to localStorage.
 */
const webStore = {
  get(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // ignore
    }
  },
  remove(key: string): void {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // ignore
    }
  },
};

const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return webStore.get(key);
  try {
    return await SecureStore.getItemAsync(key, options);
  } catch {
    return null;
  }
}

export async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStore.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, options);
}

export async function secureRemove(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStore.remove(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key, options);
  } catch {
    // ignore
  }
}
