import 'server-only';

import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';

const N = 32_768;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 64 * 1024 * 1024;

function deriveKey(password: string, salt: Buffer, keyLength: number, options: { N: number; r: number; p: number }) {
  return new Promise<Buffer>((resolve, reject) => {
    nodeScrypt(password, salt, keyLength, { ...options, maxmem: MAX_MEMORY }, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export function validatePassword(password: string) {
  if (password.length < 12) return 'Password must be at least 12 characters.';
  if (password.length > 128) return 'Password must be 128 characters or fewer.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include at least one letter and one number.';
  }
  return null;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await deriveKey(password, salt, KEY_LENGTH, { N, r: R, p: P });
  return ['scrypt', N, R, P, salt.toString('base64url'), derived.toString('base64url')].join('$');
}

export async function verifyPassword(password: string, encoded: string) {
  try {
    const [algorithm, rawN, rawR, rawP, rawSalt, rawHash] = encoded.split('$');
    if (algorithm !== 'scrypt' || !rawHash || !rawSalt) return false;
    if (Number(rawN) !== N || Number(rawR) !== R || Number(rawP) !== P) return false;
    const expected = Buffer.from(rawHash, 'base64url');
    const salt = Buffer.from(rawSalt, 'base64url');
    if (expected.length !== KEY_LENGTH || salt.length !== 16) return false;
    const actual = await deriveKey(password, salt, expected.length, {
      N: Number(rawN),
      r: Number(rawR),
      p: Number(rawP),
    });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
