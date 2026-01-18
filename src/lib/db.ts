import { openDB, DBSchema, IDBPDatabase } from 'idb';

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
}

// Water tracking (localStorage)
const WATER_KEY = 'melius-water';

export function getWaterIntake(date: string): number {
  const stored = localStorage.getItem(WATER_KEY);
  if (!stored) return 0;
  try {
    const data: Record<string, number> = JSON.parse(stored);
    return data[date] || 0;
  } catch {
    return 0;
  }
}

export function setWaterIntake(date: string, glasses: number): void {
  const stored = localStorage.getItem(WATER_KEY);
  let data: Record<string, number> = {};
  try {
    if (stored) data = JSON.parse(stored);
  } catch {}
  data[date] = glasses;
  localStorage.setItem(WATER_KEY, JSON.stringify(data));
}

export function getAllWaterData(): Record<string, number> {
  const stored = localStorage.getItem(WATER_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

interface MeliusDB extends DBSchema {
  meals: {
    key: string;
    value: Meal;
    indexes: { 'by-date': string; 'by-created': number };
  };
}

const DB_NAME = 'melius-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<MeliusDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<MeliusDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<MeliusDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const mealStore = db.createObjectStore('meals', { keyPath: 'id' });
      mealStore.createIndex('by-date', 'date');
      mealStore.createIndex('by-created', 'createdAt');
    },
  });

  return dbInstance;
}

// Meal operations
export async function addMeal(meal: Omit<Meal, 'id' | 'createdAt'>): Promise<Meal> {
  const db = await getDB();
  const newMeal: Meal = {
    ...meal,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  await db.add('meals', newMeal);
  return newMeal;
}

export async function getMeal(id: string): Promise<Meal | undefined> {
  const db = await getDB();
  return db.get('meals', id);
}

export async function getAllMeals(): Promise<Meal[]> {
  const db = await getDB();
  const meals = await db.getAll('meals');
  return meals.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getMealsByDate(date: string): Promise<Meal[]> {
  const db = await getDB();
  const meals = await db.getAllFromIndex('meals', 'by-date', date);
  return meals.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getMealsByDateRange(startDate: string, endDate: string): Promise<Meal[]> {
  const db = await getDB();
  const allMeals = await db.getAll('meals');
  return allMeals
    .filter((meal) => meal.date >= startDate && meal.date <= endDate)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateMeal(id: string, updates: Partial<Meal>): Promise<Meal | undefined> {
  const db = await getDB();
  const meal = await db.get('meals', id);
  if (!meal) return undefined;
  const updatedMeal = { ...meal, ...updates };
  await db.put('meals', updatedMeal);
  return updatedMeal;
}

export async function deleteMeal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('meals', id);
}

// Settings operations (localStorage)
const SETTINGS_KEY = 'melius-settings';

const DEFAULT_SETTINGS: Settings = {
  proStatus: false,
  devMode: false,
  darkMode: false,
  theme: 'default',
  goals: {
    calories: 2000,
  },
  waterGoal: 8,
  use24Hour: false,
};

export function getSettings(): Settings {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<Settings>): Settings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

export function updateGoals(goals: Partial<Goals>): Settings {
  const current = getSettings();
  return saveSettings({
    goals: { ...current.goals, ...goals },
  });
}

export function resetProStatus(): Settings {
  return saveSettings({
    proStatus: false,
    devMode: false,
  });
}

// Export meals to CSV
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
