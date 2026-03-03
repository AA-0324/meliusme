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
}

// ─── Encrypted localStorage helpers ────────────────────────────────

async function readEncryptedLS<T>(key: string, fallback: T): Promise<T> {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;

  let plaintext = raw;
  if (isEncrypted(raw)) {
    try { plaintext = await decrypt(raw); } catch { localStorage.removeItem(key); return fallback; }
  } else {
    // Auto-migrate plaintext → encrypted
    try { localStorage.setItem(key, await encrypt(raw)); } catch {}
  }

  try { return JSON.parse(plaintext) as T; } catch { return fallback; }
}

async function writeEncryptedLS(key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  try {
    localStorage.setItem(key, await encrypt(json));
  } catch {
    // Fallback – should not happen unless crypto unsupported
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
const DB_VERSION = 2; // Bump for schema change

let dbInstance: IDBPDatabase<MeliusDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<MeliusDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<MeliusDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // If v1 store exists, delete it so we can recreate
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

// ─── Migration: move unencrypted v1 meals into encrypted v2 ──────

let migrationDone = false;

export async function migrateOldMeals(): Promise<void> {
  if (migrationDone) return;
  migrationDone = true;

  // Check if old DB exists with plaintext meals
  try {
    const oldDB = await openDB('melius-db', 1, {
      upgrade() { /* no-op – just probing */ },
    });
    // If we got here the old db existed. Check for plain meal objects.
    if (oldDB.objectStoreNames.contains('meals')) {
      const oldMeals = await oldDB.getAll('meals');
      oldDB.close();

      if (oldMeals.length > 0 && !(oldMeals[0] as any).encrypted) {
        // They are plaintext Meal objects – re-encrypt and store in v2
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
    // Old DB doesn't exist or migration already done – fine
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
  return newMeal;
}

export async function getMeal(id: string): Promise<Meal | undefined> {
  const db = await getDB();
  const row = await db.get('meals', id);
  if (!row) return undefined;
  return decryptMeal(row);
}

export async function getAllMeals(): Promise<Meal[]> {
  const db = await getDB();
  const rows = await db.getAll('meals');
  const meals = await Promise.all(rows.map(decryptMeal));
  return meals.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getMealsByDate(date: string): Promise<Meal[]> {
  const db = await getDB();
  const rows = await db.getAllFromIndex('meals', 'by-date', date);
  const meals = await Promise.all(rows.map(decryptMeal));
  return meals.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getMealsByDateRange(startDate: string, endDate: string): Promise<Meal[]> {
  const db = await getDB();
  const allRows = await db.getAll('meals');
  // Filter by date index stored in plaintext for query purposes
  const filtered = allRows.filter((r) => r.date >= startDate && r.date <= endDate);
  const meals = await Promise.all(filtered.map(decryptMeal));
  return meals.sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateMeal(id: string, updates: Partial<Meal>): Promise<Meal | undefined> {
  const db = await getDB();
  const row = await db.get('meals', id);
  if (!row) return undefined;
  const meal = await decryptMeal(row);
  const updated = { ...meal, ...updates };
  const newRow = await encryptMeal(updated);
  await db.put('meals', newRow);
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
