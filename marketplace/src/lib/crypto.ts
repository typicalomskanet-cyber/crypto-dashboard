/** Minimal password hashing helpers using browser SubtleCrypto.
 *  Format: `pbkdf2$100000$<saltHex>$<hashHex>` (PBKDF2-HMAC-SHA-256, 100k iters,
 *  16-byte salt, 32-byte digest). Works fully client-side, no library. */

const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

function bytesToHex(buf: ArrayBuffer | Uint8Array): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of arr) s += b.toString(16).padStart(2, "0");
  return s;
}
function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

async function deriveBytes(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: ITERATIONS },
    key,
    HASH_BITS,
  );
  return new Uint8Array(bits);
}

/** Returns `pbkdf2$...$saltHex$hashHex`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await deriveBytes(password, salt);
  return `pbkdf2$${ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(hash)}`;
}

/** Compare a plaintext password against a stored encoded hash. Returns true
 *  if either the encoded hash matches or — for backwards-compat with the old
 *  plaintext storage — the value matches verbatim. */
export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  if (!encoded) return false;
  if (!encoded.startsWith("pbkdf2$")) {
    // Legacy plaintext password — accept once so the admin can log in.
    return password === encoded;
  }
  const parts = encoded.split("$");
  if (parts.length !== 4) return false;
  const salt = hexToBytes(parts[2]);
  const expected = parts[3];
  const actual = bytesToHex(await deriveBytes(password, salt));
  // Constant-time-ish compare in JS: lengths differ → fail; otherwise XOR-fold.
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** True if `encoded` is using the legacy plaintext format and should be
 *  re-hashed on next successful login. */
export function isLegacyPasswordHash(encoded: string): boolean {
  return !encoded.startsWith("pbkdf2$");
}
