// AES-GCM 256-bit encryption using Web Crypto API
// Key is stored in IndexedDB, never in localStorage

const KEY_DB_NAME = 'melius-keystore';
const KEY_DB_VERSION = 1;
const KEY_STORE = 'keys';
const KEY_ID = 'master-key';

let cachedKey: CryptoKey | null = null;

function openKeyDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(KEY_DB_NAME, KEY_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(KEY_STORE)) {
        db.createObjectStore(KEY_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

async function storeKey(key: CryptoKey): Promise<void> {
  const db = await openKeyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, 'readwrite');
    // IndexedDB supports storing non-extractable CryptoKey objects via structured clone (defense-in-depth)
    tx.objectStore(KEY_STORE).put({ id: KEY_ID, key });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadKey(): Promise<CryptoKey | null> {
  const db = await openKeyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, 'readonly');
    const req = tx.objectStore(KEY_STORE).get(KEY_ID);
    req.onsuccess = () => resolve(req.result?.key ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function getEncryptionKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  
  let key = await loadKey();
  if (!key) {
    // Generate a new extractable=false key. IndexedDB structured clone supports CryptoKey.
    key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    await storeKey(key);
  }
  cachedKey = key;
  return key;
}

/**
 * Encrypt a string → base64 blob (iv + ciphertext)
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  const encoded = new TextEncoder().encode(plaintext);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  
  // Combine IV + ciphertext into one buffer
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  // Encode as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a base64 blob → plaintext string
 */
export async function decrypt(blob: string): Promise<string> {
  const key = await getEncryptionKey();
  
  // Decode base64
  const binary = atob(blob);
  const combined = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    combined[i] = binary.charCodeAt(i);
  }
  
  // Extract IV (first 12 bytes) and ciphertext
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  
  return new TextDecoder().decode(decrypted);
}

/**
 * Check if a string looks like an encrypted blob (base64 with sufficient length)
 */
export function isEncrypted(value: string): boolean {
  // Encrypted blobs are base64 and always longer than the minimum (12 bytes IV + at least some ciphertext)
  // A valid base64 string of 12+ bytes raw = 16+ chars base64
  if (value.length < 20) return false;
  // Quick heuristic: if it starts with { or [ it's plaintext JSON
  if (value.startsWith('{') || value.startsWith('[') || value.startsWith('"')) return false;
  // Check if it's valid base64
  try {
    const decoded = atob(value);
    return decoded.length >= 13; // 12 IV + at least 1 byte ciphertext
  } catch {
    return false;
  }
}

/**
 * Initialize encryption system — call once at app startup
 */
export async function initEncryption(): Promise<void> {
  await getEncryptionKey();
}
