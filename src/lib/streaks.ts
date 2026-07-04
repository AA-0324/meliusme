// Streak and Gamification System for MeliusMe — encrypted storage

import { getEncrypted, getEncryptedJSON, setEncrypted, setEncryptedJSON } from './encryptedStorage';

const STREAK_KEY = 'melius-streak';
const CHALLENGES_KEY = 'melius-challenges';
const BADGES_KEY = 'melius-badges';
const REFLECTION_KEY = 'melius-reflection';
const XP_KEY = 'melius-xp';

// ─── Encrypted helpers ─────────────────────────────────────────────

async function readEncLS<T>(key: string, fallback: T): Promise<T> {
  return getEncryptedJSON<T>(key, fallback);
}

async function writeEncLS(key: string, value: unknown): Promise<void> {
  await setEncryptedJSON(key, value);
}

// ─── Interfaces ────────────────────────────────────────────────────

export interface ReflectionData {
  weekNumber: number;
  mealId: string;
  answeredAt: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string | null;
  streakHistory: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: number;
}

export interface Challenge {
  id: string;
  name: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  type: 'daily' | 'weekly';
  completed: boolean;
  startDate: string;
}

// ─── XP System ─────────────────────────────────────────────────────

export interface XPData {
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  currentLevelXP: number;
}

export interface LevelUpResult {
  xpData: XPData;
  leveledUp: boolean;
  previousLevel: number;
  reward: TempProUnlock | null;
}

// ─── Pro Feature Reward Pool ───────────────────────────────────────

// Each id below MUST correspond to a real feature gated by hasProFeature() in the app.
// Do not add "phantom" features here — the reward would look active but unlock nothing.
export const PRO_FEATURE_POOL = [
  { id: 'trend_charts', name: 'Trend Charts', description: 'Unlock the calorie and macro trend charts on your dashboard' },
  { id: 'nutrition_score', name: 'Nutrition Score', description: 'See your daily nutrition score on the dashboard' },
  { id: 'streak_tracker', name: 'Streak Tracker', description: 'View your logging, calorie and protein streaks' },
  { id: 'meal_type_chart', name: 'Meal Type Breakdown', description: 'View the calorie breakdown by meal type' },
  { id: 'daily_averages', name: 'Daily Averages', description: 'See per-day averages for protein, fiber, sugar and meals' },
  { id: 'meal_templates', name: 'Meal Templates', description: 'Save meals as templates and load them when logging' },
  { id: 'meal_tags', name: 'Meal Tags', description: 'Add tags to meals when logging them' },
  { id: 'custom_layouts', name: 'Custom Dashboard Layout', description: 'Reorder and hide widgets on your dashboard' },
  { id: 'dashboard_filters', name: 'Dashboard Filters', description: 'Filter your dashboard by time range' },
] as const;

export type ProFeatureId = typeof PRO_FEATURE_POOL[number]['id'];

export interface TempProUnlock {
  featureId: ProFeatureId;
  featureName: string;
  featureDescription: string;
  unlockedAt: number;
  expiresAt: number;
  fromLevel: number;
}

const TEMP_UNLOCKS_KEY = 'melius-temp-pro-unlocks';
const LAST_REWARD_KEY = 'melius-last-reward-feature';

export async function getTempProUnlocks(): Promise<TempProUnlock[]> {
  const unlocks = await readEncLS<TempProUnlock[]>(TEMP_UNLOCKS_KEY, []);
  // Filter out expired unlocks
  const now = Date.now();
  const active = unlocks.filter(u => u.expiresAt > now);
  if (active.length !== unlocks.length) {
    await writeEncLS(TEMP_UNLOCKS_KEY, active);
  }
  return active;
}

export async function hasActiveTempUnlock(): Promise<boolean> {
  const unlocks = await getTempProUnlocks();
  return unlocks.length > 0;
}

async function selectRandomProFeature(activeIds: Set<string>): Promise<typeof PRO_FEATURE_POOL[number]> {
  const lastId = await readEncLS<string>(LAST_REWARD_KEY, '');
  // Prefer features that aren't currently active AND aren't the last reward
  let pool = PRO_FEATURE_POOL.filter(f => f.id !== lastId && !activeIds.has(f.id));
  // Fall back to anything not currently active (avoid duplicates above all)
  if (pool.length === 0) pool = PRO_FEATURE_POOL.filter(f => !activeIds.has(f.id));
  // Last resort: everything (all features already active)
  if (pool.length === 0) pool = [...PRO_FEATURE_POOL];
  const selected = pool[Math.floor(Math.random() * pool.length)];
  await writeEncLS(LAST_REWARD_KEY, selected.id);
  return selected;
}

function getRewardDuration(level: number): number {
  // Levels 2-20: 24 hours, Levels 22+: 3 days
  if (level >= 22) return 3 * 24 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

async function grantLevelReward(level: number): Promise<TempProUnlock> {
  const existing = await getTempProUnlocks();
  const activeIds = new Set(existing.map(u => u.featureId));
  const feature = await selectRandomProFeature(activeIds);
  const now = Date.now();
  const duration = getRewardDuration(level);
  const unlock: TempProUnlock = {
    featureId: feature.id as ProFeatureId,
    featureName: feature.name,
    featureDescription: feature.description,
    unlockedAt: now,
    expiresAt: now + duration,
    fromLevel: level,
  };
  existing.push(unlock);
  await writeEncLS(TEMP_UNLOCKS_KEY, existing);
  return unlock;
}

// ─── XP Event Ledger (tracks XP earned per day) ───────────────────

const XP_LEDGER_KEY = 'melius-xp-ledger';

interface XPLedgerEntry {
  date: string;
  amount: number;
  source: string;
}

async function getXPLedger(): Promise<XPLedgerEntry[]> {
  return readEncLS<XPLedgerEntry[]>(XP_LEDGER_KEY, []);
}

async function addXPLedgerEntry(date: string, amount: number, source: string): Promise<void> {
  const ledger = await getXPLedger();
  ledger.push({ date, amount, source });
  await writeEncLS(XP_LEDGER_KEY, ledger);
}

export async function rollbackDailyXP(date: string, isProUser: boolean): Promise<XPData> {
  const ledger = await getXPLedger();
  const todayEntries = ledger.filter(e => e.date === date);
  const xpToRemove = todayEntries.reduce((sum, e) => sum + e.amount, 0);
  
  // Remove today's entries from ledger
  const newLedger = ledger.filter(e => e.date !== date);
  await writeEncLS(XP_LEDGER_KEY, newLedger);
  
  // Subtract XP
  const current = await getXP();
  const newTotal = Math.max(0, current - xpToRemove);
  await setEncrypted(XP_KEY, newTotal.toString());
  
  return calculateLevel(newTotal);
}

export async function getXP(): Promise<number> {
  const raw = await getEncrypted(XP_KEY);
  if (!raw) return 0;
  return parseInt(raw, 10) || 0;
}

export async function addXP(amount: number, isProUser: boolean = false, source: string = 'unknown'): Promise<LevelUpResult> {
  if (amount <= 0) {
    const data = calculateLevel(await getXP());
    return { xpData: data, leveledUp: false, previousLevel: data.level, reward: null };
  }
  const current = await getXP();
  const previousData = calculateLevel(current);
  const newTotal = current + amount;
  await setEncrypted(XP_KEY, newTotal.toString());
  const newData = calculateLevel(newTotal);

  // Record in ledger
  const today = new Date().toISOString().split('T')[0];
  await addXPLedgerEntry(today, amount, source);

  const leveledUp = newData.level > previousData.level;
  let reward: TempProUnlock | null = null;

  // Grant reward on EVERY even level crossed (handles multi-level jumps),
  // for non-Pro users only. The most recently granted reward is returned
  // for the level-up modal display; all rewards are persisted to active unlocks.
  if (leveledUp && !isProUser) {
    for (let lvl = previousData.level + 1; lvl <= newData.level; lvl++) {
      if (lvl % 2 === 0) {
        reward = await grantLevelReward(lvl);
      }
    }
  }

  return { xpData: newData, leveledUp, previousLevel: previousData.level, reward };
}

export function calculateLevel(totalXP: number): XPData {
  let level = 1;
  let xpNeeded = 100;
  let xpAccumulated = 0;
  while (xpAccumulated + xpNeeded <= totalXP) {
    xpAccumulated += xpNeeded;
    level++;
    xpNeeded = Math.floor(100 * Math.pow(1.3, level - 1));
  }
  return { totalXP, level, xpToNextLevel: xpNeeded, currentLevelXP: totalXP - xpAccumulated };
}

export async function getXPData(): Promise<XPData> {
  return calculateLevel(await getXP());
}

// ─── Badges ────────────────────────────────────────────────────────

export const AVAILABLE_BADGES: Badge[] = [
  { id: 'streak_7', name: '7 Day Streak', description: 'Logged meals 7 days in a row', icon: '7' },
  { id: 'streak_14', name: '2 Week Warrior', description: 'Logged meals 14 days in a row', icon: '14' },
  { id: 'streak_30', name: 'Month Master', description: 'Logged meals 30 days in a row', icon: '30' },
  { id: 'streak_60', name: 'Dedication King', description: 'Logged meals 60 days in a row', icon: '60' },
  { id: 'streak_100', name: 'Century Champion', description: 'Logged meals 100 days in a row', icon: '100' },
  { id: 'meals_3', name: 'Triple Threat', description: 'Logged 3 meals in one day', icon: '3' },
  { id: 'water_goal', name: 'Hydration Hero', description: 'Hit water goal 7 days straight', icon: 'H2O' },
  { id: 'within_range', name: 'Calorie Control', description: 'Stayed within calorie range 5 days', icon: 'OK' },
  { id: 'dinner_week', name: 'Dinner Devotee', description: 'Logged dinner every day for a week', icon: 'D' },
  { id: 'first_meal', name: 'First Step', description: 'Logged your first meal', icon: '1' },
];

export const STREAK_MILESTONES = [7, 14, 30, 60, 100];

export async function getEarnedBadges(): Promise<Badge[]> {
  return readEncLS<Badge[]>(BADGES_KEY, []);
}

export async function awardBadge(badgeId: string): Promise<Badge | null> {
  const earned = await getEarnedBadges();
  if (earned.some(b => b.id === badgeId)) return null;
  const badge = AVAILABLE_BADGES.find(b => b.id === badgeId);
  if (!badge) return null;
  const earnedBadge = { ...badge, earnedAt: Date.now() };
  earned.push(earnedBadge);
  await writeEncLS(BADGES_KEY, earned);
  return earnedBadge;
}

export async function checkStreakBadges(streak: number): Promise<Badge | null> {
  if (streak >= 100) return awardBadge('streak_100');
  if (streak >= 60) return awardBadge('streak_60');
  if (streak >= 30) return awardBadge('streak_30');
  if (streak >= 14) return awardBadge('streak_14');
  if (streak >= 7) return awardBadge('streak_7');
  return null;
}

// ─── Streak ────────────────────────────────────────────────────────

const DEFAULT_STREAK: StreakData = { currentStreak: 0, longestStreak: 0, lastLogDate: null, streakHistory: [] };

export async function getStreakData(): Promise<StreakData> {
  return readEncLS<StreakData>(STREAK_KEY, DEFAULT_STREAK);
}

export async function saveStreakData(data: StreakData): Promise<void> {
  await writeEncLS(STREAK_KEY, data);
}

function getLocalDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function updateStreak(mealDate: string): Promise<StreakData> {
  const data = await getStreakData();
  if (data.streakHistory.includes(mealDate)) return data;
  data.streakHistory.push(mealDate);
  if (data.lastLogDate === null) {
    data.currentStreak = 1;
  } else {
    // Parse as local date components to avoid UTC offset drift.
    const [ly, lm, ld] = data.lastLogDate.split('-').map(Number);
    const [cy, cm, cd] = mealDate.split('-').map(Number);
    const lastDate = new Date(ly, lm - 1, ld);
    const currentDate = new Date(cy, cm - 1, cd);
    const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) data.currentStreak++;
    else if (diffDays !== 0) data.currentStreak = 1;
  }
  if (data.currentStreak > data.longestStreak) data.longestStreak = data.currentStreak;
  data.lastLogDate = mealDate;
  await saveStreakData(data);
  await checkStreakBadges(data.currentStreak);
  return data;
}

/**
 * Passive streak expiry check. Resets currentStreak to 0 if the user hasn't
 * logged today or yesterday (evaluated in local time). Safe to call anytime.
 */
export async function validateStreakFreshness(): Promise<StreakData> {
  const data = await getStreakData();
  if (data.currentStreak === 0 || !data.lastLogDate) return data;

  const todayStr = getLocalDateString();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterdayStr = getLocalDateString(y);

  if (data.lastLogDate === todayStr || data.lastLogDate === yesterdayStr) {
    return data;
  }

  const updated: StreakData = { ...data, currentStreak: 0 };
  await saveStreakData(updated);
  return updated;
}

// ─── Reflection ────────────────────────────────────────────────────

export async function getLastReflection(): Promise<ReflectionData | null> {
  const data = await readEncLS<any>(REFLECTION_KEY, null);
  if (!data || data.weekStart) return null;
  return data;
}

export async function saveLastReflection(weekNumber: number, mealId: string): Promise<void> {
  await writeEncLS(REFLECTION_KEY, { weekNumber, mealId, answeredAt: Date.now() } as ReflectionData);
}

export async function wasReflectionAnswered(): Promise<boolean> {
  const data = await readEncLS<any>(REFLECTION_KEY, null);
  if (!data) return false;
  return data.weekStart === getWeekStart();
}

export async function saveReflectionAnswer(mealId: string): Promise<void> {
  await writeEncLS(REFLECTION_KEY, { weekStart: getWeekStart(), mealId, answeredAt: Date.now() });
}

// ─── Weekly Challenges ─────────────────────────────────────────────

export const WEEKLY_CHALLENGES = [
  { id: 'log_21', name: 'Log 21 meals this week', description: 'Log 3 meals per day for 7 days', target: 21 },
  { id: 'in_range_5', name: 'Stay in calorie range', description: 'Stay within calorie goal for 5 days', target: 5 },
  { id: 'dinner_week', name: 'Log every dinner', description: 'Log a dinner each day this week', target: 7 },
  { id: 'protein_power', name: 'Protein packed week', description: 'Meet protein goal 5 times', target: 5 },
  { id: 'hydrate_week', name: 'Hydration hero', description: 'Hit water goal 5 times this week', target: 5 },
  { id: 'healthy_meals', name: 'No warnings week', description: 'Log 10 meals without health warnings', target: 10 },
  { id: 'breakfast_streak', name: 'Breakfast every day', description: 'Log breakfast each day this week', target: 7 },
  { id: 'log_15', name: 'Active logger', description: 'Log at least 15 meals this week', target: 15 },
];

export const REFLECTION_QUESTIONS = [
  'Which meal this week made you feel best?',
  'What was your healthiest meal this week?',
  'Which meal was the most satisfying?',
  'What meal would you want to have again?',
  'Which meal gave you the most energy?',
  'What was your favorite breakfast this week?',
  'What was your most balanced meal?',
  'Which meal are you most proud of?',
  'What healthy choice surprised you this week?',
  'Which meal made you happiest?',
  'What would you eat differently next week?',
  'Which meal was the most colorful?',
  'What was your best homemade meal?',
  'Which snack was the smartest choice?',
];

export const INSIGHT_TEMPLATES = [
  { id: 'high_cal_day', template: 'You tend to eat more calories on {day}s.' },
  { id: 'high_protein', template: 'Your highest-protein day was {day}.' },
  { id: 'breakfast_lover', template: 'You log breakfast more consistently than other meals.' },
  { id: 'dinner_heavy', template: 'Your dinners average {calories} more calories than lunch.' },
  { id: 'weekend_splurge', template: 'You eat about {percent}% more on weekends.' },
  { id: 'water_champ', template: 'You hit your water goal {count} times this week!' },
  { id: 'consistent', template: "You've logged meals {count} days in a row. Keep it up!" },
  { id: 'meal_count', template: 'You average {count} meals per day.' },
];

// ─── Daily Challenges ──────────────────────────────────────────────

const DAILY_CHALLENGE_POOL = [
  { id: 'log_3', title: 'Log 3 meals', target: 3, type: 'meals' as const, xp: 30 },
  { id: 'log_2', title: 'Log 2 meals', target: 2, type: 'meals' as const, xp: 20 },
  { id: 'water_full', title: 'Hit your water goal', target: 1, type: 'water_goal' as const, xp: 25 },
  { id: 'water_half', title: 'Drink half your water goal', target: 1, type: 'water_half' as const, xp: 15 },
  { id: 'breakfast', title: 'Log breakfast', target: 1, type: 'breakfast' as const, xp: 15 },
  { id: 'dinner', title: 'Log dinner', target: 1, type: 'dinner' as const, xp: 15 },
  // 'under_cal' (Stay under calorie goal) is intentionally excluded from the daily pool —
  // it can only be evaluated meaningfully at the end of the day, not while logging is in progress.
  { id: 'protein_hit', title: 'Hit protein goal', target: 1, type: 'protein_goal' as const, xp: 20 },
  { id: 'log_snack', title: 'Log a snack', target: 1, type: 'snack' as const, xp: 10 },
  { id: 'all_meals', title: 'Log breakfast, lunch & dinner', target: 3, type: 'main_meals' as const, xp: 40 },
  { id: 'lunch', title: 'Log lunch', target: 1, type: 'lunch' as const, xp: 15 },
];

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const shuffled = [...arr];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export interface DailyChallenge {
  id: string;
  title: string;
  target: number;
  progress: number;
  completed: boolean;
  xp: number;
}

export function getDailyChallenges(
  todaysMealTypes: string[],
  waterCount: number,
  waterGoal: number,
  goals: { calories?: number; protein?: number; fiber?: number; sugar?: number },
  todayCalories?: number,
  todayProtein?: number
): DailyChallenge[] {
  const today = new Date().toISOString().split('T')[0];
  // Use a stronger hash so consecutive days produce very different seeds
  let seed = 0;
  for (let i = 0; i < today.length; i++) {
    seed = ((seed << 5) - seed + today.charCodeAt(i)) | 0;
  }
  // Exclude challenges that can't be achieved given the user's current goals
  // (e.g. protein challenge with no protein goal set — would stay 0/1 forever).
  const achievablePool = DAILY_CHALLENGE_POOL.filter(c => {
    if (c.type === 'protein_goal') return !!goals.protein && goals.protein > 0;
    return true;
  });
  const shuffled = seededShuffle(achievablePool, seed);
  const picked = shuffled.slice(0, 3);

  const mealCount = todaysMealTypes.length;
  const hasBreakfast = todaysMealTypes.includes('breakfast');
  const hasLunch = todaysMealTypes.includes('lunch');
  const hasDinner = todaysMealTypes.includes('dinner');
  const hasSnack = todaysMealTypes.includes('snack');
  const mainMealCount = [hasBreakfast, hasLunch, hasDinner].filter(Boolean).length;

  return picked.map((c) => {
    let progress = 0;
    const hasLoggedMeals = mealCount > 0;
    switch (c.type) {
      case 'meals': progress = Math.min(mealCount, c.target); break;
      case 'water_goal': progress = waterCount >= waterGoal ? 1 : 0; break;
      case 'water_half': progress = waterCount >= Math.ceil(waterGoal / 2) ? 1 : 0; break;
      case 'breakfast': progress = hasBreakfast ? 1 : 0; break;
      case 'lunch': progress = hasLunch ? 1 : 0; break;
      case 'dinner': progress = hasDinner ? 1 : 0; break;
      case 'snack': progress = hasSnack ? 1 : 0; break;
      // 'under_cal' removed from pool — see DAILY_CHALLENGE_POOL comment.
      case 'protein_goal': progress = (hasLoggedMeals && todayProtein !== undefined && goals.protein && todayProtein >= goals.protein) ? 1 : 0; break;
      case 'main_meals': progress = mainMealCount; break;
      default: progress = 0;
    }
    return {
      id: c.id, title: c.title, target: c.target,
      progress: Math.min(progress, c.target),
      completed: progress >= c.target, xp: c.xp,
    };
  });
}

export function getWeeklyReflectionQuestion(): string {
  const weekNumber = getWeekNumber();
  return REFLECTION_QUESTIONS[weekNumber % REFLECTION_QUESTIONS.length];
}

async function calculateWeeklyChallengeProgress(challengeId: string, meals: any[], weekStart: string): Promise<number> {
  const weekStartDate = new Date(weekStart);
  const weekMeals = meals.filter(m => new Date(m.date) >= weekStartDate);
  const today = new Date().toISOString().split('T')[0];

  // Lazy-import db helpers to avoid circular deps and to read encrypted storage correctly
  const { getSettings, getAllWaterData } = await import('./db');
  const settings = await getSettings();
  const calGoal = settings.goals?.calories ?? 2000;
  const proteinGoal = settings.goals?.protein ?? 50;
  const sugarLimit = settings.goals?.sugar ?? 50;
  const waterGoal = settings.waterGoal ?? 8;

  switch (challengeId) {
    case 'log_21': case 'log_15': return weekMeals.length;
    case 'dinner_week': return new Set(weekMeals.filter(m => m.mealType === 'dinner').map(m => m.date)).size;
    case 'breakfast_streak': return new Set(weekMeals.filter(m => m.mealType === 'breakfast').map(m => m.date)).size;
    case 'healthy_meals': {
      return weekMeals.filter(m => {
        const calOk = m.calories <= calGoal * 0.4;
        const sugarOk = !m.sugar || m.sugar <= sugarLimit * 0.5;
        return calOk && sugarOk;
      }).length;
    }
    case 'protein_power': {
      const dailyProtein: Record<string, number> = {};
      weekMeals.forEach(m => {
        dailyProtein[m.date] = (dailyProtein[m.date] || 0) + (m.protein || 0);
      });
      return Object.values(dailyProtein).filter(p => p >= proteinGoal).length;
    }
    case 'hydrate_week': {
      const waterData = await getAllWaterData();
      let count = 0;
      for (const [date, glasses] of Object.entries(waterData)) {
        if (new Date(date) >= weekStartDate && (glasses as number) >= waterGoal) count++;
      }
      return count;
    }
    case 'in_range_5': {
      // Only evaluate days that have ENDED — exclude today, since calorie totals
      // can change before midnight. (Stay-under-calories is an end-of-day check.)
      const dailyCals: Record<string, number> = {};
      weekMeals.forEach(m => {
        if (m.date === today) return;
        dailyCals[m.date] = (dailyCals[m.date] || 0) + m.calories;
      });
      return Object.entries(dailyCals).filter(([, cal]) => cal > 0 && cal <= calGoal).length;
    }
    default: return 0;
  }
}

export async function getCurrentChallenge(meals?: any[]): Promise<Challenge> {
  const stored = await readEncLS<Challenge | null>(CHALLENGES_KEY, null);
  const weekStart = getWeekStart();

  if (stored && stored.startDate === weekStart) {
    if (meals) {
      const updatedProgress = await calculateWeeklyChallengeProgress(stored.id, meals, weekStart);
      if (updatedProgress !== stored.progress) {
        stored.progress = updatedProgress;
        stored.completed = stored.progress >= stored.target;
        await writeEncLS(CHALLENGES_KEY, stored);
      }
    }
    return stored;
  }

  const weekNumber = getWeekNumber();
  const challengeIndex = weekNumber % WEEKLY_CHALLENGES.length;
  const template = WEEKLY_CHALLENGES[challengeIndex];

  const challenge: Challenge = {
    id: template.id, name: template.name, title: template.name,
    description: template.description, target: template.target,
    progress: 0, type: 'weekly', completed: false, startDate: weekStart,
  };

  if (meals) {
    challenge.progress = await calculateWeeklyChallengeProgress(challenge.id, meals, weekStart);
    challenge.completed = challenge.progress >= challenge.target;
  }

  await writeEncLS(CHALLENGES_KEY, challenge);
  return challenge;
}

export async function updateChallengeProgress(amount: number = 1): Promise<Challenge> {
  const challenge = await getCurrentChallenge();
  challenge.progress = Math.min(challenge.progress + amount, challenge.target);
  challenge.completed = challenge.progress >= challenge.target;
  await writeEncLS(CHALLENGES_KEY, challenge);
  return challenge;
}

export function isLastWeekOver(): boolean { return true; }
export function getLastWeekNumber(): number { return getWeekNumber() - 1; }

export function getLastWeekStart(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) - 7;
  const lastMonday = new Date(today.getFullYear(), today.getMonth(), diff);
  return lastMonday.toISOString().split('T')[0];
}

function getWeekStart(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.getFullYear(), today.getMonth(), diff);
  return monday.toISOString().split('T')[0];
}

function getWeekNumber(): number {
  const today = new Date();
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
  const pastDaysOfYear = (today.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export function generateInsight(meals: any[]): string | null {
  if (meals.length < 5) return null;
  const insights: string[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const caloriesByDay = [0, 0, 0, 0, 0, 0, 0];
  const countByDay = [0, 0, 0, 0, 0, 0, 0];
  const proteinByDay = [0, 0, 0, 0, 0, 0, 0];

  meals.forEach(meal => {
    const d = new Date(meal.date).getDay();
    caloriesByDay[d] += meal.calories; proteinByDay[d] += meal.protein || 0; countByDay[d]++;
  });

  const avgByDay = caloriesByDay.map((c, i) => countByDay[i] > 0 ? c / countByDay[i] : 0);
  const maxCalDay = avgByDay.indexOf(Math.max(...avgByDay.filter(v => v > 0)));
  const maxProteinDay = proteinByDay.indexOf(Math.max(...proteinByDay.filter(v => v > 0)));

  if (maxCalDay >= 0 && avgByDay[maxCalDay] > 0) insights.push(`You tend to eat more calories on ${dayNames[maxCalDay]}s.`);
  if (maxProteinDay >= 0 && proteinByDay[maxProteinDay] > 0) insights.push(`Your highest-protein day was ${dayNames[maxProteinDay]}.`);

  const breakfastDays = new Set(meals.filter(m => m.mealType === 'breakfast').map(m => m.date)).size;
  const totalDays = new Set(meals.map(m => m.date)).size;
  if (breakfastDays > totalDays * 0.7) insights.push('You log breakfast more consistently than other meals. Great habit!');

  const avgMeals = meals.length / Math.max(totalDays, 1);
  if (avgMeals > 0) insights.push(`You average ${avgMeals.toFixed(1)} meals per day.`);

  if (insights.length === 0) return null;
  return insights[Math.floor(Math.random() * insights.length)];
}
