import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { encrypt, decrypt, isEncrypted } from './crypto';
import { getEncryptedJSON, setEncryptedJSON } from './encryptedStorage';

export interface Meal {
  id: string;
  photo: string;
  calories: number;
  protein?: number;
  fiber?: number;
  sugar?: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  tags?: string[];
  date: string;
  time: string;
  createdAt: number;
}

export interface Goals {
  calories: number;
  protein?: number;
  fiber?: number;
  sugar?: number;
}

export interface WaterIntake {
  date: string;
  glasses: number;
}

export interface Settings {
  proStatus: boolean;
  darkMode: boolean;
  theme: string;
  goals: Goals;
  waterGoal: number;
  use24Hour: boolean;
  personalizedGoals?: boolean;
  animationsEnabled?: boolean;
  /** Three-tier animation preference. 'full' = all, 'reduced' = essential transitions only, 'off' = none. */
  animationLevel?: 'full' | 'reduced' | 'off';
}

export const DEFAULT_GOALS: Goals = { calories: 2000, protein: 50, fiber: 25, sugar: 50 };
export const DEFAULT_WATER_GOAL = 8;

export function getBasicSettingsResetPatch(): Partial<Settings> {
  return {
    proStatus: false,
    theme: 'default',
    personalizedGoals: false,
    goals: { ...DEFAULT_GOALS },
    waterGoal: DEFAULT_WATER_GOAL,
  };
}

// ─── Encrypted localStorage helpers ────────────────────────────────

async function writeEncryptedLS(key: string, value: unknown): Promise<void> {
  await setEncryptedJSON(key, value);
}

// ─── Water tracking ────────────────────────────────────────────────

const WATER_KEY = 'melius-water';

export async function getWaterIntake(date: string): Promise<number> {
  const data = await getEncryptedJSON<Record<string, number>>(WATER_KEY, {});
  return data[date] || 0;
}

export async function setWaterIntake(date: string, glasses: number): Promise<void> {
  const data = await getEncryptedJSON<Record<string, number>>(WATER_KEY, {});
  data[date] = glasses;
  await writeEncryptedLS(WATER_KEY, data);
}

export async function getAllWaterData(): Promise<Record<string, number>> {
  return getEncryptedJSON<Record<string, number>>(WATER_KEY, {});
}

// ─── IndexedDB for meals (encrypted values) ───────────────────────

interface MeliusDB extends DBSchema {
  meals: {
    key: string;
    value: { id: string; encrypted: string };
    indexes: { 'by-date': string; 'by-created': number };
  };
}

const DB_NAME = 'melius-db';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<MeliusDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<MeliusDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<MeliusDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, tx) {
      if (!db.objectStoreNames.contains('meals')) {
        const store = db.createObjectStore('meals', { keyPath: 'id' });
        store.createIndex('by-date', 'date');
        store.createIndex('by-created', 'createdAt');
        return;
      }

      const store = tx.objectStore('meals');
      if (oldVersion < 2 && !store.indexNames.contains('by-date')) {
        store.createIndex('by-date', 'date');
      }
      if (oldVersion < 2 && !store.indexNames.contains('by-created')) {
        store.createIndex('by-created', 'createdAt');
      }
    },
  });

  return dbInstance;
}

// ─── Decrypted meal cache ─────────────────────────────────────────
//
// Meal payloads are stored as opaque ciphertext, so IndexedDB indexes cannot
// be used for date lookups without persisting plaintext metadata (which would
// weaken the encryption guarantee). Instead we decrypt each row at most once
// and keep the plaintext in memory only, so repeated date queries cost an
// array scan rather than N AES-GCM operations.
//
// The cache is bounded: meals carry photo data URLs, so an unbounded map would
// grow with the whole history. Oldest insertions are evicted first and simply
// get decrypted again on demand.
const MEAL_CACHE_LIMIT = 400;
const mealCache = new Map<string, Meal>();

function cacheMeal(meal: Meal) {
  if (mealCache.size >= MEAL_CACHE_LIMIT && !mealCache.has(meal.id)) {
    const oldest = mealCache.keys().next();
    if (!oldest.done) mealCache.delete(oldest.value);
  }
  mealCache.set(meal.id, meal);
}

function invalidateMeal(id: string) {
  mealCache.delete(id);
}

/** Drop the in-memory plaintext cache (used by destructive resets and tests). */
export function clearMealCache() {
  mealCache.clear();
}

async function encryptMeal(meal: Meal): Promise<{ id: string; encrypted: string }> {
  const serialized = JSON.stringify(meal);
  const encrypted = await encrypt(serialized);
  const verified = await decrypt(encrypted);
  if (verified !== serialized) throw new Error('Meal encryption verification failed');
  return { id: meal.id, encrypted };
}

/** A decrypted payload is only usable if it still looks like a meal record. */
function isMealShape(value: unknown): value is Meal {
  const m = value as Meal | null;
  return !!m && typeof m === 'object' && typeof m.id === 'string' && typeof m.date === 'string' && typeof m.calories === 'number';
}

/**
 * Decrypt a stored row. Falls back to reading legacy plaintext rows in memory
 * so pre-encryption data stays readable. Returns null for unreadable rows.
 */
async function decryptMeal(row: { id: string; encrypted: string }): Promise<Meal | null> {
  const cached = mealCache.get(row.id);
  if (cached) return cached;
  let meal: unknown = null;
  try {
    meal = JSON.parse(await decrypt(row.encrypted));
  } catch {
    try { meal = JSON.parse(row.encrypted); } catch { meal = null; }
  }
  if (!isMealShape(meal)) return null;
  cacheMeal(meal);
  return meal;
}

/** Decrypt every stored row once, skipping unreadable ones. */
async function readAllMeals(): Promise<Meal[]> {
  let rows: { id: string; encrypted: string }[] = [];
  try {
    const db = await getDB();
    rows = await db.getAll('meals');
  } catch (error) {
    // A failed IndexedDB open must not take the whole app down.
    console.error('[db] Unable to read meals:', error);
    return [];
  }
  const meals: Meal[] = [];
  for (const row of rows) {
    const meal = await decryptMeal(row);
    if (meal) meals.push(meal);
  }
  return meals;
}

const byNewest = (a: Meal, b: Meal) => b.createdAt - a.createdAt;


// ─── Migration ──────

/**
 * Encrypt any row still stored as plaintext (pre-encryption installs).
 *
 * Encryption happens *before* the write transaction is opened: awaiting a
 * non-IndexedDB promise inside a transaction lets the browser auto-close it,
 * which previously made this migration abort halfway. Rows that cannot be
 * encrypted and verified are left exactly as they are — a migration failure
 * must never delete or replace user data.
 */
export async function migratePlaintextMeals(): Promise<void> {
  let rows: unknown[] = [];
  try {
    const db = await getDB();
    rows = await db.getAll('meals');
  } catch (error) {
    console.error('[db] Meal migration skipped, database unavailable:', error);
    return;
  }
  if (rows.length === 0) return;

  const pending: { id: string; encrypted: string }[] = [];
  for (const row of rows as Record<string, unknown>[]) {
    const encryptedValue = row?.encrypted;
    if (typeof encryptedValue === 'string' && isEncrypted(encryptedValue)) continue;

    let candidate: unknown = null;
    if (typeof encryptedValue === 'string') {
      try { candidate = JSON.parse(encryptedValue); } catch { candidate = null; }
    } else if (row?.id && row?.mealType) {
      candidate = row;
    }

    if (!isMealShape(candidate)) continue;
    try {
      pending.push(await encryptMeal(candidate));
    } catch {
      // Keep original record untouched if encryption cannot be verified.
    }
  }

  if (pending.length === 0) return;
  try {
    const db = await getDB();
    const tx = db.transaction('meals', 'readwrite');
    for (const encryptedRow of pending) {
      tx.store.put(encryptedRow);
    }
    await tx.done;
  } catch (error) {
    console.error('[db] Meal migration could not be committed:', error);
  }
}



// ─── Meal CRUD ─────────────────────────────────────────────────────

export async function addMeal(meal: Omit<Meal, 'id' | 'createdAt'>): Promise<Meal> {
  const db = await getDB();
  const newMeal: Meal = {
    ...meal,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  const row = await encryptMeal(newMeal);
  await db.add('meals', row);
  mealCache.set(newMeal.id, newMeal);

  return newMeal;
}

export async function getMeal(id: string): Promise<Meal | undefined> {
  const cached = mealCache.get(id);
  if (cached) return cached;
  const db = await getDB();
  const row = await db.get('meals', id);
  if (!row) return undefined;
  return (await decryptMeal(row)) ?? undefined;
}

export async function getAllMeals(): Promise<Meal[]> {
  return (await readAllMeals()).sort(byNewest);
}

export async function getMealsByDate(date: string): Promise<Meal[]> {
  const meals = await readAllMeals();
  return meals.filter(m => m.date === date).sort(byNewest);
}

export async function getMealsByDateRange(startDate: string, endDate: string): Promise<Meal[]> {
  const meals = await readAllMeals();
  return meals.filter(m => m.date >= startDate && m.date <= endDate).sort(byNewest);
}

export async function updateMeal(id: string, updates: Partial<Meal>): Promise<Meal | undefined> {
  const db = await getDB();
  const row = await db.get('meals', id);
  if (!row) return undefined;
  const meal = await decryptMeal(row);
  if (!meal) return undefined;
  const updated = { ...meal, ...updates };
  const newRow = await encryptMeal(updated);
  await db.put('meals', newRow);
  mealCache.set(id, updated);
  return updated;
}

export async function deleteMeal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('meals', id);
  invalidateMeal(id);
}

export async function deleteMealsByDate(date: string): Promise<void> {
  const meals = await readAllMeals();
  const doomed = meals.filter(m => m.date === date);
  if (doomed.length === 0) return;
  const db = await getDB();
  const tx = db.transaction('meals', 'readwrite');
  for (const meal of doomed) {
    await tx.store.delete(meal.id);
    invalidateMeal(meal.id);
  }
  await tx.done;
}


// ─── Settings (encrypted localStorage) ────────────────────────────

const SETTINGS_KEY = 'melius-settings';

const DEFAULT_SETTINGS: Settings = {
  proStatus: false,
  darkMode: false,
  theme: 'default',
  goals: { ...DEFAULT_GOALS },
  waterGoal: DEFAULT_WATER_GOAL,
  use24Hour: false,
  animationsEnabled: true,
  animationLevel: 'full',
};

export async function getSettings(): Promise<Settings> {
  return getEncryptedJSON<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS).then(s => ({ ...DEFAULT_SETTINGS, ...s }));
}

export async function saveSettings(settings: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await writeEncryptedLS(SETTINGS_KEY, updated);
  return updated;
}

export async function updateGoals(goals: Partial<Goals>): Promise<Settings> {
  const current = await getSettings();
  return saveSettings({ goals: { ...current.goals, ...goals } });
}

export async function resetProStatus(): Promise<Settings> {
  return saveSettings(getBasicSettingsResetPatch());
}

export async function resetToBasicSettings(): Promise<Settings> {
  return saveSettings(getBasicSettingsResetPatch());
}

/**
 * Entitlement revocation (verified "no longer entitled" from RevenueCat).
 * Turns off Pro-only presentation state but deliberately keeps the user's own
 * numbers — goals and water target are their data, not a Pro feature.
 */
export async function revokeProStatus(): Promise<Settings> {
  return saveSettings({ proStatus: false, theme: 'default', personalizedGoals: false });
}

// ─── CSV export ────────────────────────────────────────────────────

/**
 * Escape a CSV field: quote it when needed and neutralise leading characters
 * that spreadsheet apps would interpret as a formula.
 */
function csvField(value: string | number | undefined | null): string {
  const raw = value === undefined || value === null ? '' : String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * Export every readable meal as CSV. Only the user's own tracked fields are
 * included — no keys, ids, encrypted blobs or photo payloads.
 */
export async function exportMealsToCSV(): Promise<string> {
  const meals = await getAllMeals();
  const headers = ['Date', 'Time', 'Meal Type', 'Calories', 'Protein', 'Fiber', 'Sugar', 'Tags'];
  const rows = meals.map((meal) => [
    meal.date,
    meal.time,
    meal.mealType,
    meal.calories,
    meal.protein ?? '',
    meal.fiber ?? '',
    meal.sugar ?? '',
    meal.tags?.join('; ') ?? '',
  ]);
  return [headers.join(','), ...rows.map((row) => row.map(csvField).join(','))].join('\n');
}
