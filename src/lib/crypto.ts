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
 * Convert Uint8Array to base64 string (chunk-safe, no stack overflow)
 */
function uint8ToBase64(bytes: Uint8Array): string {
  let binaryStr = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binaryStr += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binaryStr);
}

/**
 * Encrypt a string → base64 blob (iv + ciphertext)
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return uint8ToBase64(combined);
}

/**
 * Decrypt a base64 blob → plaintext string
 */
export async function decrypt(blob: string): Promise<string> {
  const key = await getEncryptionKey();
  
  const binary = atob(blob);
  const combined = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    combined[i] = binary.charCodeAt(i);
  }
  
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
 * Check if a string looks like an encrypted blob
 */
export function isEncrypted(value: string): boolean {
  if (value.length < 20) return false;
  if (value.startsWith('{') || value.startsWith('[') || value.startsWith('"')) return false;
  try {
    const decoded = atob(value);
    return decoded.length >= 13;
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
