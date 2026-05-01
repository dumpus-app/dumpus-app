/**
 * Decrypt a package blob downloaded from S3.
 *
 * The worker writes each blob as `AES-CBC(SHA-256(UPN), iv, PKCS7(gzippedSqlite))`.
 * Decryption happens entirely client-side — the server never sees the UPN —
 * so the encryption key truly stays with the user.
 *
 * SubtleCrypto's AES-CBC handles PKCS7 padding for us. Returns the gzipped
 * SQLite bytes; caller still needs to inflate.
 */

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error(`invalid iv hex length: ${hex.length}`);
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function decryptPackageBlob(
  encrypted: ArrayBuffer,
  ivHex: string,
  upnKey: string,
): Promise<ArrayBuffer> {
  const iv = hexToBytes(ivHex);
  if (iv.length !== 16) {
    throw new Error(`expected 16-byte iv, got ${iv.length}`);
  }

  const upnBytes = new TextEncoder().encode(upnKey);
  const keyDigest = await crypto.subtle.digest("SHA-256", upnBytes);
  const key = await crypto.subtle.importKey(
    "raw",
    keyDigest,
    { name: "AES-CBC" },
    false,
    ["decrypt"],
  );

  return crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, encrypted);
}
