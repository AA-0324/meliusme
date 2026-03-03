// Encrypted localStorage wrapper
// All values are encrypted with AES-GCM before storage

import { encrypt, decrypt, isEncrypted } from './crypto';

/**
 * Read and decrypt a value from localStorage.
 * Returns null if key doesn't exist.
 * Handles migration of plaintext values automatically.
 */
export async function getEncrypted(key: string): Promise<string | null> {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  
  // If the value is plaintext (not encrypted), migrate it
  if (!isEncrypted(raw)) {
    // Auto-migrate: encrypt and replace
    try {
      const encrypted = await encrypt(raw);
      localStorage.setItem(key, encrypted);
    } catch {
      // If encryption fails, return plaintext for now
    }
    return raw;
  }
  
  try {
    return await decrypt(raw);
  } catch {
    // If decryption fails (e.g. key changed), return null
    console.warn(`Failed to decrypt ${key}, clearing corrupted entry`);
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Encrypt and store a value in localStorage.
 */
export async function setEncrypted(key: string, value: string): Promise<void> {
  const encrypted = await encrypt(value);
  localStorage.setItem(key, encrypted);
}

/**
 * Remove a key from localStorage.
 */
export function removeEncrypted(key: string): void {
  localStorage.removeItem(key);
}

/**
 * Convenience: read, parse JSON, with fallback.
 */
export async function getEncryptedJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await getEncrypted(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Convenience: stringify and encrypt JSON.
 */
export async function setEncryptedJSON<T>(key: string, value: T): Promise<void> {
  await setEncrypted(key, JSON.stringify(value));
}

/**
 * Migrate all known melius keys from plaintext to encrypted.
 * Called once at app startup.
 */
export async function migrateAllToEncrypted(): Promise<void> {
  const KNOWN_KEYS = [
    'melius-settings',
    'melius-water',
    'melius-user-profile',
    'melius-body-profile',
    'melius-auto-goals',
    'melius-streak',
    'melius-challenges',
    'melius-badges',
    'melius-reflection',
    'melius-xp',
    'melius-notifications',
  ];
  
  // Also migrate dynamic keys (goal toasts, etc.)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('meliusme-goal-toasts-')) {
      KNOWN_KEYS.push(key);
    }
  }
  
  for (const key of KNOWN_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null && !isEncrypted(raw)) {
      try {
        const encrypted = await encrypt(raw);
        localStorage.setItem(key, encrypted);
      } catch (e) {
        console.warn(`Migration failed for ${key}:`, e);
      }
    }
  }
}
