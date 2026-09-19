import { getRandomValues } from 'expo-crypto';
import nacl from 'tweetnacl';

import { base64ToBytes, bytesToBase64, bytesToHex, bytesToUtf8, utf8ToBytes } from '@/lib/crypto/base64';
import { secureGet, secureSet } from '@/lib/crypto/secureStore';
import { supabase } from '@/lib/supabase';

/**
 * End-to-end encryption (X25519 + XSalsa20-Poly1305 via tweetnacl).
 *
 * - Each device generates an identity key pair once and stores the private key
 *   in the OS keychain. Only the public key is published to `public.user_keys`.
 * - For a 1:1 chat both sides derive the same shared key (ECDH), so messages and
 *   media are encrypted on the sender's device and decrypted only on the peer's.
 * - The server (Supabase / Go API / LiveKit) stores and relays ciphertext only.
 */

nacl.setPRNG((target, length) => {
  const random = new Uint8Array(length);
  getRandomValues(random);
  target.set(random);
  random.fill(0);
});

const TEXT_PREFIX = 'e2e1.';
const ENCRYPTED_FILE_SUFFIX = '.enc';
const IDENTITY_KEY = (userId: string) => `orzuchat.e2e.identity.v1.${userId}`;

type Identity = { publicKey: Uint8Array; secretKey: Uint8Array };

let currentUserId: string | null = null;
let identity: Identity | null = null;
let initPromise: Promise<void> | null = null;
const peerKeyCache = new Map<string, Uint8Array | null>();
const sharedKeyCache = new Map<string, Uint8Array>();
const decryptedTextCache = new Map<string, string>();

async function loadOrCreateIdentity(userId: string): Promise<Identity> {
  const stored = await secureGet(IDENTITY_KEY(userId));
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { pk: string; sk: string };
      return { publicKey: base64ToBytes(parsed.pk), secretKey: base64ToBytes(parsed.sk) };
    } catch {
      // corrupted entry: regenerate below
    }
  }
  const pair = nacl.box.keyPair();
  await secureSet(
    IDENTITY_KEY(userId),
    JSON.stringify({ pk: bytesToBase64(pair.publicKey), sk: bytesToBase64(pair.secretKey) }),
  );
  return pair;
}

async function publishPublicKey(userId: string, publicKey: Uint8Array): Promise<void> {
  const encoded = bytesToBase64(publicKey);
  const { data, error: readError } = await supabase
    .from('user_keys')
    .select('public_key')
    .eq('user_id', userId)
    .maybeSingle();
  if (readError) {
    console.warn('e2e: user_keys unavailable — apply supabase/migrations/20260919150000_e2e_keys_security.sql');
    return;
  }
  if (data?.public_key === encoded) return;
  const { error } = await supabase
    .from('user_keys')
    .upsert({ user_id: userId, public_key: encoded }, { onConflict: 'user_id' });
  if (error) {
    console.warn('e2e: publish key failed', error.message);
  }
}

/** Loads (or generates) the device identity for the signed-in user and publishes the public key. */
export function initE2E(userId: string): Promise<void> {
  if (currentUserId === userId && initPromise) return initPromise;
  currentUserId = userId;
  identity = null;
  peerKeyCache.clear();
  sharedKeyCache.clear();
  initPromise = (async () => {
    identity = await loadOrCreateIdentity(userId);
    await publishPublicKey(userId, identity.publicKey);
  })().catch((error: unknown) => {
    console.warn('e2e: init failed', error instanceof Error ? error.message : error);
  });
  return initPromise;
}

/** Forget in-memory state (identity stays in the keychain so the user can log back in). */
export function resetE2E(): void {
  currentUserId = null;
  identity = null;
  initPromise = null;
  peerKeyCache.clear();
  sharedKeyCache.clear();
  decryptedTextCache.clear();
}

export function isE2EReady(): boolean {
  return identity !== null;
}

async function fetchPeerPublicKey(peerId: string): Promise<Uint8Array | null> {
  if (identity && peerId === currentUserId) return identity.publicKey;
  if (peerKeyCache.has(peerId)) return peerKeyCache.get(peerId) ?? null;
  const { data, error } = await supabase
    .from('user_keys')
    .select('public_key')
    .eq('user_id', peerId)
    .maybeSingle();
  if (error) {
    // Table missing (migration not applied yet) or transient failure: remember the miss
    // so we do not hammer the API; `forgetPeerKey` clears it.
    console.warn('e2e: peer key lookup failed', error.message);
    peerKeyCache.set(peerId, null);
    return null;
  }
  const key = data?.public_key ? base64ToBytes(data.public_key) : null;
  peerKeyCache.set(peerId, key);
  return key;
}

/**
 * Shared 32-byte key for a 1:1 conversation with `peerId`.
 * Returns null when the peer has not published a key yet (older app version).
 */
export async function sharedKeyWith(peerId: string): Promise<Uint8Array | null> {
  if (initPromise) await initPromise;
  if (!identity) return null;
  const cached = sharedKeyCache.get(peerId);
  if (cached) return cached;
  const peerKey = await fetchPeerPublicKey(peerId);
  if (!peerKey) return null;
  const shared = nacl.box.before(peerKey, identity.secretKey);
  sharedKeyCache.set(peerId, shared);
  return shared;
}

/** Drop cached peer key (e.g. after the peer re-installed the app). */
export function forgetPeerKey(peerId: string): void {
  peerKeyCache.delete(peerId);
  sharedKeyCache.delete(peerId);
}

export function isEncryptedText(body: string | null | undefined): body is string {
  return typeof body === 'string' && body.startsWith(TEXT_PREFIX);
}

export function encryptText(sharedKey: Uint8Array, text: string): string {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const cipher = nacl.secretbox(utf8ToBytes(text), nonce, sharedKey);
  return `${TEXT_PREFIX}${bytesToBase64(nonce)}.${bytesToBase64(cipher)}`;
}

export function decryptText(sharedKey: Uint8Array, payload: string, cacheId?: string): string | null {
  if (cacheId) {
    const cached = decryptedTextCache.get(cacheId);
    if (cached !== undefined) return cached;
  }
  if (!isEncryptedText(payload)) return payload;
  const [, nonceB64, cipherB64] = payload.split('.');
  if (!nonceB64 || !cipherB64) return null;
  try {
    const opened = nacl.secretbox.open(base64ToBytes(cipherB64), base64ToBytes(nonceB64), sharedKey);
    if (!opened) return null;
    const text = bytesToUtf8(opened);
    if (cacheId) decryptedTextCache.set(cacheId, text);
    return text;
  } catch {
    return null;
  }
}

export function encryptBytes(sharedKey: Uint8Array, bytes: Uint8Array): Uint8Array {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const cipher = nacl.secretbox(bytes, nonce, sharedKey);
  const out = new Uint8Array(nonce.length + cipher.length);
  out.set(nonce, 0);
  out.set(cipher, nonce.length);
  return out;
}

export function decryptBytes(sharedKey: Uint8Array, payload: Uint8Array): Uint8Array | null {
  if (payload.length <= nacl.secretbox.nonceLength) return null;
  const nonce = payload.subarray(0, nacl.secretbox.nonceLength);
  const cipher = payload.subarray(nacl.secretbox.nonceLength);
  return nacl.secretbox.open(cipher, nonce, sharedKey);
}

export function isEncryptedPath(path: string): boolean {
  return path.endsWith(ENCRYPTED_FILE_SUFFIX);
}

export function encryptedPath(path: string): string {
  return `${path}${ENCRYPTED_FILE_SUFFIX}`;
}

/**
 * Per-call media key for LiveKit frame encryption, derived from the chat shared key
 * and the call id so every call uses a fresh key.
 */
export function deriveCallKey(sharedKey: Uint8Array, callId: string): string {
  const material = new Uint8Array(sharedKey.length + callId.length + 16);
  material.set(sharedKey, 0);
  material.set(utf8ToBytes(callId), sharedKey.length);
  material.set(utf8ToBytes('orzuchat/call/v1'), sharedKey.length + callId.length);
  return bytesToBase64(nacl.hash(material).subarray(0, 32));
}

/** Human-readable safety code of this device's identity key (for profile screen). */
export function identityFingerprint(): string | null {
  if (!identity) return null;
  const hex = bytesToHex(nacl.hash(identity.publicKey).subarray(0, 10));
  return hex.toUpperCase().match(/.{1,5}/g)?.join(' ') ?? hex;
}
