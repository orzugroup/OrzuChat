import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupportedStorage } from '@supabase/supabase-js';
import { getRandomValues } from 'expo-crypto';
import nacl from 'tweetnacl';

import { base64ToBytes, bytesToBase64, bytesToUtf8, utf8ToBytes } from '@/lib/crypto/base64';
import { secureGet, secureSet } from '@/lib/crypto/secureStore';

/**
 * Supabase session storage hardened for mobile:
 * the auth session (refresh token, JWT) is encrypted with a random key that lives
 * only in the OS keychain, and the ciphertext is kept in AsyncStorage.
 * (Keychain itself has a ~2 KB value limit on iOS, so the session cannot live there directly.)
 */
const MASTER_KEY_ID = 'orzuchat.session.master.v1';
const PREFIX = 'sec1.';

let masterKeyPromise: Promise<Uint8Array> | null = null;

async function masterKey(): Promise<Uint8Array> {
  if (!masterKeyPromise) {
    masterKeyPromise = (async () => {
      const stored = await secureGet(MASTER_KEY_ID);
      if (stored) return base64ToBytes(stored);
      const fresh = new Uint8Array(nacl.secretbox.keyLength);
      getRandomValues(fresh);
      await secureSet(MASTER_KEY_ID, bytesToBase64(fresh));
      return fresh;
    })();
  }
  return masterKeyPromise;
}

async function seal(value: string): Promise<string> {
  const key = await masterKey();
  const nonce = new Uint8Array(nacl.secretbox.nonceLength);
  getRandomValues(nonce);
  const cipher = nacl.secretbox(utf8ToBytes(value), nonce, key);
  return `${PREFIX}${bytesToBase64(nonce)}.${bytesToBase64(cipher)}`;
}

async function open(value: string): Promise<string | null> {
  if (!value.startsWith(PREFIX)) return value; // legacy plaintext session, migrated on next write
  const [, nonce, cipher] = value.split('.');
  if (!nonce || !cipher) return null;
  const key = await masterKey();
  const plain = nacl.secretbox.open(base64ToBytes(cipher), base64ToBytes(nonce), key);
  return plain ? bytesToUtf8(plain) : null;
}

export const encryptedSessionStorage: SupportedStorage = {
  async getItem(key) {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return null;
    try {
      return await open(raw);
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    await AsyncStorage.setItem(key, await seal(value));
  },
  async removeItem(key) {
    await AsyncStorage.removeItem(key);
  },
};
