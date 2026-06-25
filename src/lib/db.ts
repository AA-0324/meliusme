import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { encrypt, decrypt, isEncrypted } from './crypto';

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
  devMode: boolean;
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

// ─── Encrypted localStorage helpers ────────────────────────────────

async function readEncryptedLS<T>(key: string, fallback: T): Promise<T> {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;

  let plaintext = raw;
  if (isEncrypted(raw)) {
    try { plaintext = await decrypt(raw); } catch { localStorage.removeItem(key); return fallback; }
  } else {
    try { localStorage.setItem(key, await encrypt(raw)); } catch {}
  }

  try { return JSON.parse(plaintext) as T; } catch { return fallback; }
}

async function writeEncryptedLS(key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  try {
    localStorage.setItem(key, await encrypt(json));
  } catch {
    localStorage.setItem(key, json);
  }
}

// ─── Water tracking ────────────────────────────────────────────────

const WATER_KEY = 'melius-water';

export async function getWaterIntake(date: string): Promise<number> {
  const data = await readEncryptedLS<Record<string, number>>(WATER_KEY, {});
  return data[date] || 0;
}

export async function setWaterIntake(date: string, glasses: number): Promise<void> {
  const data = await readEncryptedLS<Record<string, number>>(WATER_KEY, {});
  data[date] = glasses;
  await writeEncryptedLS(WATER_KEY, data);
}

export async function getAllWaterData(): Promise<Record<string, number>> {
  return readEncryptedLS<Record<string, number>>(WATER_KEY, {});
}

// ─── IndexedDB for meals (encrypted values) ───────────────────────

interface MeliusDB extends DBSchema {
  meals: {
    key: string;
    value: { id: string; encrypted: string; date: string; createdAt: number };
    indexes: { 'by-date': string; 'by-created': number };
  };
}

const DB_NAME = 'melius-db';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<MeliusDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<MeliusDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<MeliusDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (db.objectStoreNames.contains('meals')) {
        db.deleteObjectStore('meals');
      }
      const store = db.createObjectStore('meals', { keyPath: 'id' });
      store.createIndex('by-date', 'date');
      store.createIndex('by-created', 'createdAt');
    },
  });

  return dbInstance;
}

async function encryptMeal(meal: Meal): Promise<{ id: string; encrypted: string; date: string; createdAt: number }> {
  const encrypted = await encrypt(JSON.stringify(meal));
  return { id: meal.id, encrypted, date: meal.date, createdAt: meal.createdAt };
}

async function decryptMeal(row: { id: string; encrypted: string }): Promise<Meal> {
  const json = await decrypt(row.encrypted);
  return JSON.parse(json) as Meal;
}

// ─── Migration ──────

let migrationDone = false;

export async function migrateOldMeals(): Promise<void> {
  if (migrationDone) return;
  migrationDone = true;

  try {
    const oldDB = await openDB('melius-db', 1, {
      upgrade() {},
    });
    if (oldDB.objectStoreNames.contains('meals')) {
      const oldMeals = await oldDB.getAll('meals');
      oldDB.close();

      if (oldMeals.length > 0 && !(oldMeals[0] as any).encrypted) {
        const db = await getDB();
        const tx = db.transaction('meals', 'readwrite');
        for (const meal of oldMeals as unknown as Meal[]) {
          const enc = await encryptMeal(meal);
          await tx.store.put(enc);
        }
        await tx.done;
      }
    } else {
      oldDB.close();
    }
  } catch {
    // Old DB doesn't exist or migration already done
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
  
  try {
    const row = await encryptMeal(newMeal);
    await db.add('meals', row);
  } catch (err) {
    // Fallback: store without encryption if encryption fails
    console.warn('Encryption failed for meal, storing with minimal encryption:', err);
    const fallbackRow = {
      id: newMeal.id,
      encrypted: JSON.stringify(newMeal),
      date: newMeal.date,
      createdAt: newMeal.createdAt,
    };
    await db.add('meals', fallbackRow);
  }
  
  return newMeal;
}

export async function getMeal(id: string): Promise<Meal | undefined> {
  const db = await getDB();
  const row = await db.get('meals', id);
  if (!row) return undefined;
  try {
    return await decryptMeal(row);
  } catch {
    // Fallback: try parsing as plain JSON
    try { return JSON.parse(row.encrypted) as Meal; } catch { return undefined; }
  }
}

export async function getAllMeals(): Promise<Meal[]> {
  const db = await getDB();
  const rows = await db.getAll('meals');
  const meals: Meal[] = [];
  for (const row of rows) {
    try {
      meals.push(await decryptMeal(row));
    } catch {
      try { meals.push(JSON.parse(row.encrypted) as Meal); } catch {}
    }
  }
  return meals.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getMealsByDate(date: string): Promise<Meal[]> {
  const db = await getDB();
  const rows = await db.getAllFromIndex('meals', 'by-date', date);
  const meals: Meal[] = [];
  for (const row of rows) {
    try {
      meals.push(await decryptMeal(row));
    } catch {
      try { meals.push(JSON.parse(row.encrypted) as Meal); } catch {}
    }
  }
  return meals.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getMealsByDateRange(startDate: string, endDate: string): Promise<Meal[]> {
  const db = await getDB();
  const allRows = await db.getAll('meals');
  const filtered = allRows.filter((r) => r.date >= startDate && r.date <= endDate);
  const meals: Meal[] = [];
  for (const row of filtered) {
    try {
      meals.push(await decryptMeal(row));
    } catch {
      try { meals.push(JSON.parse(row.encrypted) as Meal); } catch {}
    }
  }
  return meals.sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateMeal(id: string, updates: Partial<Meal>): Promise<Meal | undefined> {
  const db = await getDB();
  const row = await db.get('meals', id);
  if (!row) return undefined;
  let meal: Meal;
  try { meal = await decryptMeal(row); } catch {
    try { meal = JSON.parse(row.encrypted) as Meal; } catch { return undefined; }
  }
  const updated = { ...meal, ...updates };
  try {
    const newRow = await encryptMeal(updated);
    await db.put('meals', newRow);
  } catch {
    await db.put('meals', { id: updated.id, encrypted: JSON.stringify(updated), date: updated.date, createdAt: updated.createdAt });
  }
  return updated;
}

export async function deleteMeal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('meals', id);
}

export async function deleteMealsByDate(date: string): Promise<void> {
  const db = await getDB();
  const rows = await db.getAllFromIndex('meals', 'by-date', date);
  const tx = db.transaction('meals', 'readwrite');
  for (const row of rows) {
    await tx.store.delete(row.id);
  }
  await tx.done;
}

// ─── Settings (encrypted localStorage) ────────────────────────────

const SETTINGS_KEY = 'melius-settings';

const DEFAULT_SETTINGS: Settings = {
  proStatus: false,
  devMode: false,
  darkMode: false,
  theme: 'default',
  goals: { calories: 2000 },
  waterGoal: 8,
  use24Hour: false,
  animationsEnabled: true,
  animationLevel: 'full',
};

export async function getSettings(): Promise<Settings> {
  return readEncryptedLS<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS).then(s => ({ ...DEFAULT_SETTINGS, ...s }));
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
  return saveSettings({ proStatus: false, devMode: false });
}

// ─── CSV export ────────────────────────────────────────────────────

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
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
