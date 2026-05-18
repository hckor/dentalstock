// Web Crypto API 기반 PIN 해시 유틸
// PBKDF2(SHA-256, 100,000 iterations) + 16바이트 random salt
// 결과 포맷: "pbkdf2$<iterations>$<saltBase64>$<hashBase64>"

const ITERATIONS = 100_000;
const HASH_LEN_BITS = 256;

function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuf(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function deriveBits(pin, salt, iterations) {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  return window.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    HASH_LEN_BITS
  );
}

export async function hashPin(pin) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const hashBuf = await deriveBits(pin, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${bufToBase64(salt.buffer)}$${bufToBase64(hashBuf)}`;
}

export async function verifyPinHash(pin, stored) {
  // 평문(레거시) 비교: 마이그레이션 미완 사용자
  if (!stored || !stored.startsWith("pbkdf2$")) {
    return pin === stored;
  }
  const parts = stored.split("$");
  if (parts.length !== 4) return false;
  const iterations = parseInt(parts[1], 10);
  const salt = new Uint8Array(base64ToBuf(parts[2]));
  const expected = parts[3];
  const hashBuf = await deriveBits(pin, salt, iterations);
  // 상수 시간 비교
  return constantTimeEqual(bufToBase64(hashBuf), expected);
}

export function isHashed(stored) {
  return typeof stored === "string" && stored.startsWith("pbkdf2$");
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
