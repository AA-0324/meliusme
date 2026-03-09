// Pro Features Storage and Management
import { encrypt, decrypt, isEncrypted } from './crypto';
import { Meal, Goals } from './db';

// ─── Encrypted localStorage helpers ────────────────────────────────
async function readEncLS<T>(key: string, fallback: T): Promise<T> {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  let plaintext = raw;
  if (isEncrypted(raw)) {
    try { plaintext = await decrypt(raw); } catch { return fallback; }
  } else {
    try { localStorage.setItem(key, await encrypt(raw)); } catch {}
  }
  try { return JSON.parse(plaintext) as T; } catch { return fallback; }
}

async function writeEncLS(key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  try { localStorage.setItem(key, await encrypt(json)); } catch { localStorage.setItem(key, json); }
}

// ─── Meal Templates ────────────────────────────────────────────────

export interface MealTemplate {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein?: number;
  fiber?: number;
  sugar?: number;
  tags?: string[];
  createdAt: number;
}

const TEMPLATES_KEY = 'melius-meal-templates';

export async function getMealTemplates(): Promise<MealTemplate[]> {
  const templates = await readEncLS<MealTemplate[]>(TEMPLATES_KEY, []);
  return templates.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveMealTemplate(template: Omit<MealTemplate, 'id' | 'createdAt'>): Promise<MealTemplate> {
  const templates = await getMealTemplates();
  const newTemplate: MealTemplate = {
    ...template,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  templates.push(newTemplate);
  await writeEncLS(TEMPLATES_KEY, templates);
  return newTemplate;
}

export async function deleteMealTemplate(id: string): Promise<void> {
  const templates = await getMealTemplates();
  const filtered = templates.filter(t => t.id !== id);
  await writeEncLS(TEMPLATES_KEY, filtered);
}

// ─── Meal Edit History ─────────────────────────────────────────────

export interface MealEdit {
  id: string;
  mealId: string;
  timestamp: number;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

const EDIT_HISTORY_KEY = 'melius-meal-edits';

export async function getMealEditHistory(mealId: string): Promise<MealEdit[]> {
  const allEdits = await readEncLS<MealEdit[]>(EDIT_HISTORY_KEY, []);
  return allEdits
    .filter(e => e.mealId === mealId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export async function recordMealEdit(mealId: string, changes: MealEdit['changes']): Promise<void> {
  if (changes.length === 0) return;
  const allEdits = await readEncLS<MealEdit[]>(EDIT_HISTORY_KEY, []);
  const newEdit: MealEdit = {
    id: crypto.randomUUID(),
    mealId,
    timestamp: Date.now(),
    changes,
  };
  allEdits.push(newEdit);
  await writeEncLS(EDIT_HISTORY_KEY, allEdits);
}

// ─── Dashboard Layout Customization ────────────────────────────────

export interface DashboardWidget {
  id: string;
  name: string;
  visible: boolean;
  order: number;
}

const DASHBOARD_LAYOUT_KEY = 'melius-dashboard-layout';

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'stats', name: 'Weekly Stats', visible: true, order: 0 },
  { id: 'goals', name: "Today's Goals", visible: true, order: 1 },
  { id: 'weekly-chart', name: 'This Week Chart', visible: true, order: 2 },
  { id: 'meal-type', name: 'By Meal Type', visible: true, order: 3 },
  { id: 'averages', name: 'Weekly Averages', visible: true, order: 4 },
  { id: 'streaks', name: 'Streaks', visible: true, order: 5 },
  { id: 'nutrition-score', name: 'Nutrition Score', visible: true, order: 6 },
  { id: 'trends', name: 'Long-term Trends', visible: true, order: 7 },
];

export async function getDashboardLayout(): Promise<DashboardWidget[]> {
  const layout = await readEncLS<DashboardWidget[]>(DASHBOARD_LAYOUT_KEY, DEFAULT_WIDGETS);
  return layout.sort((a, b) => a.order - b.order);
}

export async function saveDashboardLayout(widgets: DashboardWidget[]): Promise<void> {
  await writeEncLS(DASHBOARD_LAYOUT_KEY, widgets);
}

export async function resetDashboardLayout(): Promise<void> {
  await writeEncLS(DASHBOARD_LAYOUT_KEY, DEFAULT_WIDGETS);
}

// ─── Streaks Tracking ──────────────────────────────────────────────

export interface StreaksData {
  loggingStreak: number;
  calorieTargetStreak: number;
  proteinGoalStreak: number;
  lastLoggingDate: string | null;
  lastCalorieDate: string | null;
  lastProteinDate: string | null;
}

const STREAKS_DATA_KEY = 'melius-pro-streaks';

const DEFAULT_STREAKS: StreaksData = {
  loggingStreak: 0,
  calorieTargetStreak: 0,
  proteinGoalStreak: 0,
  lastLoggingDate: null,
  lastCalorieDate: null,
  lastProteinDate: null,
};

export async function getStreaksData(): Promise<StreaksData> {
  return readEncLS<StreaksData>(STREAKS_DATA_KEY, DEFAULT_STREAKS);
}

export async function updateStreaksData(
  date: string,
  hasLogged: boolean,
  metCalorieTarget: boolean,
  metProteinGoal: boolean
): Promise<StreaksData> {
  const streaks = await getStreaksData();

  if (hasLogged) {
    if (streaks.lastLoggingDate === null) {
      streaks.loggingStreak = 1;
    } else if (streaks.lastLoggingDate !== date) {
      const lastDate = new Date(streaks.lastLoggingDate);
      const currentDate = new Date(date);
      const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streaks.loggingStreak++;
      } else if (diffDays > 1) {
        streaks.loggingStreak = 1;
      }
    }
    streaks.lastLoggingDate = date;
  }

  if (metCalorieTarget) {
    if (streaks.lastCalorieDate === null) {
      streaks.calorieTargetStreak = 1;
    } else if (streaks.lastCalorieDate !== date) {
      const lastDate = new Date(streaks.lastCalorieDate);
      const currentDate = new Date(date);
      const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streaks.calorieTargetStreak++;
      } else if (diffDays > 1) {
        streaks.calorieTargetStreak = 1;
      }
    }
    streaks.lastCalorieDate = date;
  }

  if (metProteinGoal) {
    if (streaks.lastProteinDate === null) {
      streaks.proteinGoalStreak = 1;
    } else if (streaks.lastProteinDate !== date) {
      const lastDate = new Date(streaks.lastProteinDate);
      const currentDate = new Date(date);
      const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streaks.proteinGoalStreak++;
      } else if (diffDays > 1) {
        streaks.proteinGoalStreak = 1;
      }
    }
    streaks.lastProteinDate = date;
  }

  await writeEncLS(STREAKS_DATA_KEY, streaks);
  return streaks;
}

// ─── Nutrition Score Calculator ────────────────────────────────────

export function calculateNutritionScore(
  calories: number,
  protein: number,
  fiber: number,
  sugar: number,
  goals: Goals,
  hasMealsToday: boolean
): number {
  // No meals logged = no score
  if (!hasMealsToday || calories === 0) return 0;

  let score = 0;

  // Calorie adherence (40 points max)
  if (goals.calories) {
    const calorieRatio = calories / goals.calories;
    if (calorieRatio >= 0.9 && calorieRatio <= 1.1) {
      score += 40;
    } else if (calorieRatio >= 0.8 && calorieRatio <= 1.2) {
      score += 30;
    } else if (calorieRatio >= 0.7 && calorieRatio <= 1.3) {
      score += 20;
    } else {
      score += 10;
    }
  } else {
    score += 20;
  }

  // Protein goal completion (25 points max)
  if (goals.protein) {
    const proteinRatio = protein / goals.protein;
    if (proteinRatio >= 1.0) {
      score += 25;
    } else if (proteinRatio >= 0.8) {
      score += 20;
    } else if (proteinRatio >= 0.6) {
      score += 15;
    } else {
      score += 5;
    }
  } else {
    if (protein >= 50) score += 25;
    else if (protein >= 30) score += 15;
    else if (protein > 0) score += 10;
  }

  // Fiber intake (20 points max)
  if (goals.fiber) {
    const fiberRatio = fiber / goals.fiber;
    if (fiberRatio >= 1.0) {
      score += 20;
    } else if (fiberRatio >= 0.8) {
      score += 15;
    } else if (fiberRatio >= 0.6) {
      score += 10;
    } else if (fiber > 0) {
      score += 5;
    }
  } else {
    if (fiber >= 25) score += 20;
    else if (fiber >= 20) score += 15;
    else if (fiber >= 15) score += 10;
    else if (fiber > 0) score += 5;
  }

  // Sugar limit adherence (15 points max)
  if (goals.sugar) {
    if (sugar <= goals.sugar) {
      score += 15;
    } else if (sugar <= goals.sugar * 1.2) {
      score += 10;
    } else if (sugar <= goals.sugar * 1.5) {
      score += 5;
    }
  } else {
    if (sugar === 0) score += 15;
    else if (sugar <= 30) score += 12;
    else if (sugar <= 50) score += 8;
    else if (sugar <= 75) score += 4;
  }

  return Math.min(100, Math.max(0, score));
}
