// Encrypted browser storage wrapper.
// Sensitive values are stored as ciphertext in IndexedDB. Legacy plaintext or
// ciphertext localStorage values are migrated on read and removed only after a
// verified encrypted IndexedDB write.

import { encrypt, decrypt, isEncrypted } from './crypto';

const STORAGE_DB_NAME = 'melius-secure-storage';
const STORAGE_DB_VERSION = 1;
const STORAGE_STORE = 'records';

interface StoredRecord {
  key: string;
  value: string;
  updatedAt: number;
}

let storageDBPromise: Promise<IDBDatabase> | null = null;

function openStorageDB(): Promise<IDBDatabase> {
  if (storageDBPromise) return storageDBPromise;
  storageDBPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(STORAGE_DB_NAME, STORAGE_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORAGE_STORE)) {
        db.createObjectStore(STORAGE_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return storageDBPromise;
}

async function readRecord(key: string): Promise<string | null> {
  const db = await openStorageDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORAGE_STORE, 'readonly');
    const req = tx.objectStore(STORAGE_STORE).get(key);
    req.onsuccess = () => resolve((req.result as StoredRecord | undefined)?.value ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function writeRecord(key: string, value: string): Promise<void> {
  const db = await openStorageDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORAGE_STORE, 'readwrite');
    tx.objectStore(STORAGE_STORE).put({ key, value, updatedAt: Date.now() } satisfies StoredRecord);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteRecord(key: string): Promise<void> {
  const db = await openStorageDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORAGE_STORE, 'readwrite');
    tx.objectStore(STORAGE_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function migrateLegacyLocalStorageValue(key: string, raw: string): Promise<string | null> {
  try {
    const plaintext = isEncrypted(raw) ? await decrypt(raw) : raw;
    const encrypted = await encrypt(plaintext);
    const verified = await decrypt(encrypted);
    if (verified !== plaintext) throw new Error('Encrypted storage verification failed');
    await writeRecord(key, encrypted);
    const stored = await readRecord(key);
    if (!stored || await decrypt(stored) !== plaintext) throw new Error('Encrypted storage migration failed');
    localStorage.removeItem(key);
    return plaintext;
  } catch {
    // Preserve the original localStorage value if migration cannot be verified.
    return null;
  }
}

/**
 * Read and decrypt a value from encrypted IndexedDB storage.
 * Returns null if key doesn't exist.
 * Handles migration of legacy localStorage values automatically.
 */
export async function getEncrypted(key: string): Promise<string | null> {
  const stored = await readRecord(key);
  if (stored) {
    try {
      return await decrypt(stored);
    } catch {
      return null;
    }
  }

  const legacy = localStorage.getItem(key);
  if (legacy === null) return null;
  const migrated = await migrateLegacyLocalStorageValue(key, legacy);
  if (migrated !== null) return migrated;

  // Last-resort backward-compatible in-memory read. The original legacy value
  // stays untouched so a failed migration cannot corrupt existing user data.
  try {
    return isEncrypted(legacy) ? await decrypt(legacy) : legacy;
  } catch {
    return null;
  }
}

/**
 * Encrypt and store a value in IndexedDB.
 */
export async function setEncrypted(key: string, value: string): Promise<void> {
  const encrypted = await encrypt(value);
  const verified = await decrypt(encrypted);
  if (verified !== value) throw new Error('Encrypted storage verification failed');
  await writeRecord(key, encrypted);
  localStorage.removeItem(key);
}

/**
 * Remove a key from encrypted IndexedDB and any legacy localStorage copy.
 */
export async function removeEncrypted(key: string): Promise<void> {
  try { await deleteRecord(key); } catch {}
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
  const localKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) localKeys.push(key);
  }

  for (const key of localKeys) {
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
    if (raw !== null) {
      await migrateLegacyLocalStorageValue(key, raw);
    }
  }
}
