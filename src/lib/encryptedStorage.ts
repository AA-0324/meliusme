// Encrypted localStorage wrapper.
// Sensitive values are never intentionally written as readable JSON.

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
    // Auto-migrate: encrypt and replace only after round-trip verification.
    try {
      const encrypted = await encrypt(raw);
      const verified = await decrypt(encrypted);
      if (verified !== raw) throw new Error('Encrypted storage verification failed');
      localStorage.setItem(key, encrypted);
    } catch {
      // Preserve legacy plaintext if migration fails; callers still receive it
      // in memory so existing users do not lose data.
    }
    return raw;
  }
  
  try {
    return await decrypt(raw);
  } catch {
    // Fall back safely without exposing or deleting unreadable data.
    return null;
  }
}

/**
 * Encrypt and store a value in localStorage.
 */
export async function setEncrypted(key: string, value: string): Promise<void> {
  const encrypted = await encrypt(value);
  const verified = await decrypt(encrypted);
  if (verified !== value) throw new Error('Encrypted storage verification failed');
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
    'melius-xp-ledger',
    'melius-temp-pro-unlocks',
    'melius-last-reward-feature',
    'melius-notifications',
    'melius-meal-templates',
    'melius-meal-edits',
    'melius-dashboard-layout',
    'melius-pro-streaks',
    'meliusme-consent',
  ];
  
  // Also migrate dynamic keys (goal toasts, etc.)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key && (
        key.startsWith('meliusme-goal-toasts-') ||
        key.startsWith('melius-daily-xp-awarded-')
      )
    ) {
      KNOWN_KEYS.push(key);
    }
  }
  
  for (const key of KNOWN_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null && !isEncrypted(raw)) {
      try {
        const encrypted = await encrypt(raw);
        const verified = await decrypt(encrypted);
        if (verified !== raw) throw new Error('Encrypted storage verification failed');
        localStorage.setItem(key, encrypted);
      } catch {
        // Preserve the original plaintext if migration cannot be verified.
      }
    }
  }
}
