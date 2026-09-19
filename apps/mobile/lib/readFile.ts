import { File } from 'expo-file-system';
import * as LegacyFS from 'expo-file-system/legacy';

function decodeBase64(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function readUriBytes(uri: string): Promise<Uint8Array> {
  try {
    const buffer = await new File(uri).arrayBuffer();
    if (buffer.byteLength > 0) return new Uint8Array(buffer);
  } catch {
    // Android content:// and some iOS ph:// URIs need another reader.
  }

  try {
    const response = await fetch(uri);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > 0) return new Uint8Array(buffer);
    }
  } catch {
    // Fall through to the legacy filesystem API.
  }

  const base64 = await LegacyFS.readAsStringAsync(uri, {
    encoding: LegacyFS.EncodingType.Base64,
  });
  return decodeBase64(base64);
}
