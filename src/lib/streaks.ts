// Streak and Gamification System for MeliusMe

const STREAK_KEY = 'meliusme-streak';
const CHALLENGES_KEY = 'meliusme-challenges';
const BADGES_KEY = 'meliusme-badges';
const REFLECTION_KEY = 'meliusme-reflection';
const XP_KEY = 'meliusme-xp';

export interface ReflectionData {
  weekNumber: number;
  mealId: string;
  answeredAt: number;
}

export function getLastReflection(): ReflectionData | null {
  const stored = localStorage.getItem(REFLECTION_KEY);
  if (!stored) return null;
  try {
    const data = JSON.parse(stored);
    if (data.weekStart) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveLastReflection(weekNumber: number, mealId: string): void {
  const data: ReflectionData = { weekNumber, mealId, answeredAt: Date.now() };
  localStorage.setItem(REFLECTION_KEY, JSON.stringify(data));
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

// XP System
export interface XPData {
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  currentLevelXP: number;
}

export function getXP(): number {
  const stored = localStorage.getItem(XP_KEY);
  return stored ? parseInt(stored, 10) || 0 : 0;
}

export function addXP(amount: number): XPData {
  const current = getXP();
  const newTotal = current + amount;
  localStorage.setItem(XP_KEY, newTotal.toString());
  return calculateLevel(newTotal);
}

export function calculateLevel(totalXP: number): XPData {
  // Each level requires progressively more XP
  let level = 1;
  let xpNeeded = 100; // Level 1 -> 2 needs 100 XP
  let xpAccumulated = 0;

  while (xpAccumulated + xpNeeded <= totalXP) {
    xpAccumulated += xpNeeded;
    level++;
    xpNeeded = Math.floor(100 * Math.pow(1.3, level - 1));
  }

  return {
    totalXP,
    level,
    xpToNextLevel: xpNeeded,
    currentLevelXP: totalXP - xpAccumulated,
  };
}

export function getXPData(): XPData {
  return calculateLevel(getXP());
}

// Streak milestones
export const STREAK_MILESTONES = [7, 14, 30, 60, 100];

// Available badges
export const AVAILABLE_BADGES: Badge[] = [
  { id: 'streak_7', name: '7 Day Streak', description: 'Logged meals 7 days in a row', icon: '🔥' },
  { id: 'streak_14', name: '2 Week Warrior', description: 'Logged meals 14 days in a row', icon: '⚡' },
  { id: 'streak_30', name: 'Month Master', description: 'Logged meals 30 days in a row', icon: '🏆' },
  { id: 'streak_60', name: 'Dedication King', description: 'Logged meals 60 days in a row', icon: '👑' },
  { id: 'streak_100', name: 'Century Champion', description: 'Logged meals 100 days in a row', icon: '💎' },
  { id: 'meals_3', name: 'Triple Threat', description: 'Logged 3 meals in one day', icon: '🎯' },
  { id: 'water_goal', name: 'Hydration Hero', description: 'Hit water goal 7 days straight', icon: '💧' },
  { id: 'within_range', name: 'Calorie Control', description: 'Stayed within calorie range 5 days', icon: '⚖️' },
  { id: 'dinner_week', name: 'Dinner Devotee', description: 'Logged dinner every day for a week', icon: '🍽️' },
  { id: 'first_meal', name: 'First Step', description: 'Logged your first meal', icon: '🌟' },
];

// Weekly challenges - rotates each week using week number
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

// Daily challenge pool - 3 are picked per day based on date seed
const DAILY_CHALLENGE_POOL = [
  { id: 'log_3', title: 'Log 3 meals', target: 3, type: 'meals' as const, xp: 30 },
  { id: 'log_2', title: 'Log 2 meals', target: 2, type: 'meals' as const, xp: 20 },
  { id: 'water_full', title: 'Hit your water goal', target: 1, type: 'water_goal' as const, xp: 25 },
  { id: 'water_half', title: 'Drink half your water goal', target: 1, type: 'water_half' as const, xp: 15 },
  { id: 'breakfast', title: 'Log breakfast', target: 1, type: 'breakfast' as const, xp: 15 },
  { id: 'dinner', title: 'Log dinner', target: 1, type: 'dinner' as const, xp: 15 },
  { id: 'under_cal', title: 'Stay under calorie goal', target: 1, type: 'under_cal' as const, xp: 25 },
  { id: 'protein_hit', title: 'Hit protein goal', target: 1, type: 'protein_goal' as const, xp: 20 },
  { id: 'log_snack', title: 'Log a snack', target: 1, type: 'snack' as const, xp: 10 },
  { id: 'all_meals', title: 'Log breakfast, lunch & dinner', target: 3, type: 'main_meals' as const, xp: 40 },
];

// Seeded shuffle for consistent daily challenges
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
  const seed = today.split('-').reduce((acc, v) => acc * 31 + parseInt(v), 0);
  const shuffled = seededShuffle(DAILY_CHALLENGE_POOL, seed);
  const picked = shuffled.slice(0, 3);

  const mealCount = todaysMealTypes.length;
  const hasBreakfast = todaysMealTypes.includes('breakfast');
  const hasLunch = todaysMealTypes.includes('lunch');
  const hasDinner = todaysMealTypes.includes('dinner');
  const hasSnack = todaysMealTypes.includes('snack');
  const mainMealCount = [hasBreakfast, hasLunch, hasDinner].filter(Boolean).length;

  return picked.map((c) => {
    let progress = 0;
    switch (c.type) {
      case 'meals': progress = Math.min(mealCount, c.target); break;
      case 'water_goal': progress = waterCount >= waterGoal ? 1 : 0; break;
      case 'water_half': progress = waterCount >= Math.ceil(waterGoal / 2) ? 1 : 0; break;
      case 'breakfast': progress = hasBreakfast ? 1 : 0; break;
      case 'dinner': progress = hasDinner ? 1 : 0; break;
      case 'snack': progress = hasSnack ? 1 : 0; break;
      case 'under_cal': progress = (todayCalories !== undefined && goals.calories && todayCalories <= goals.calories) ? 1 : 0; break;
      case 'protein_goal': progress = (todayProtein !== undefined && goals.protein && todayProtein >= goals.protein) ? 1 : 0; break;
      case 'main_meals': progress = mainMealCount; break;
      default: progress = 0;
    }
    return {
      id: c.id,
      title: c.title,
      target: c.target,
      progress: Math.min(progress, c.target),
      completed: progress >= c.target,
      xp: c.xp,
    };
  });
}

// Reflection questions - asked weekly
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

// Micro insights templates
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

// Get streak data
export function getStreakData(): StreakData {
  const stored = localStorage.getItem(STREAK_KEY);
  if (!stored) return { currentStreak: 0, longestStreak: 0, lastLogDate: null, streakHistory: [] };
  try { return JSON.parse(stored); } catch { return { currentStreak: 0, longestStreak: 0, lastLogDate: null, streakHistory: [] }; }
}

export function saveStreakData(data: StreakData): void {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

export function updateStreak(mealDate: string): StreakData {
  const data = getStreakData();
  if (data.streakHistory.includes(mealDate)) return data;
  data.streakHistory.push(mealDate);
  if (data.lastLogDate === null) {
    data.currentStreak = 1;
  } else {
    const lastDate = new Date(data.lastLogDate);
    const currentDate = new Date(mealDate);
    const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) data.currentStreak++;
    else if (diffDays !== 0) data.currentStreak = 1;
  }
  if (data.currentStreak > data.longestStreak) data.longestStreak = data.currentStreak;
  data.lastLogDate = mealDate;
  saveStreakData(data);
  checkStreakBadges(data.currentStreak);
  return data;
}

export function getEarnedBadges(): Badge[] {
  const stored = localStorage.getItem(BADGES_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

export function awardBadge(badgeId: string): Badge | null {
  const earned = getEarnedBadges();
  if (earned.some(b => b.id === badgeId)) return null;
  const badge = AVAILABLE_BADGES.find(b => b.id === badgeId);
  if (!badge) return null;
  const earnedBadge = { ...badge, earnedAt: Date.now() };
  earned.push(earnedBadge);
  localStorage.setItem(BADGES_KEY, JSON.stringify(earned));
  return earnedBadge;
}

export function checkStreakBadges(streak: number): Badge | null {
  if (streak >= 100) return awardBadge('streak_100');
  if (streak >= 60) return awardBadge('streak_60');
  if (streak >= 30) return awardBadge('streak_30');
  if (streak >= 14) return awardBadge('streak_14');
  if (streak >= 7) return awardBadge('streak_7');
  return null;
}

// Get current week's challenge
export function getCurrentChallenge(meals?: any[]): Challenge {
  const stored = localStorage.getItem(CHALLENGES_KEY);
  const weekStart = getWeekStart();

  if (stored) {
    try {
      const challenge = JSON.parse(stored) as Challenge;
      if (challenge.startDate === weekStart) {
        // Recalculate progress if meals provided
        if (meals) {
          const updatedProgress = calculateWeeklyChallengeProgress(challenge.id, meals, weekStart);
          if (updatedProgress !== challenge.progress) {
            challenge.progress = updatedProgress;
            challenge.completed = challenge.progress >= challenge.target;
            localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenge));
          }
        }
        return challenge;
      }
    } catch {}
  }

  const weekNumber = getWeekNumber();
  const challengeIndex = weekNumber % WEEKLY_CHALLENGES.length;
  const template = WEEKLY_CHALLENGES[challengeIndex];

  const challenge: Challenge = {
    id: template.id,
    name: template.name,
    title: template.name,
    description: template.description,
    target: template.target,
    progress: 0,
    type: 'weekly',
    completed: false,
    startDate: weekStart,
  };

  if (meals) {
    challenge.progress = calculateWeeklyChallengeProgress(challenge.id, meals, weekStart);
    challenge.completed = challenge.progress >= challenge.target;
  }

  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenge));
  return challenge;
}

function calculateWeeklyChallengeProgress(challengeId: string, meals: any[], weekStart: string): number {
  const weekStartDate = new Date(weekStart);
  const weekMeals = meals.filter(m => new Date(m.date) >= weekStartDate);

  switch (challengeId) {
    case 'log_21':
    case 'log_15':
      return weekMeals.length;
    case 'dinner_week': {
      const dinnerDays = new Set(weekMeals.filter(m => m.mealType === 'dinner').map(m => m.date));
      return dinnerDays.size;
    }
    case 'breakfast_streak': {
      const breakfastDays = new Set(weekMeals.filter(m => m.mealType === 'breakfast').map(m => m.date));
      return breakfastDays.size;
    }
    case 'healthy_meals':
      return weekMeals.length; // simplified - count all meals
    default:
      return 0;
  }
}

export function updateChallengeProgress(amount: number = 1): Challenge {
  const challenge = getCurrentChallenge();
  challenge.progress = Math.min(challenge.progress + amount, challenge.target);
  challenge.completed = challenge.progress >= challenge.target;
  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenge));
  return challenge;
}

export function getWeeklyReflectionQuestion(): string {
  const weekNumber = getWeekNumber();
  return REFLECTION_QUESTIONS[weekNumber % REFLECTION_QUESTIONS.length];
}

export function wasReflectionAnswered(): boolean {
  const stored = localStorage.getItem(REFLECTION_KEY);
  if (!stored) return false;
  try {
    const data = JSON.parse(stored);
    return data.weekStart === getWeekStart();
  } catch { return false; }
}

export function saveReflectionAnswer(mealId: string): void {
  localStorage.setItem(REFLECTION_KEY, JSON.stringify({ weekStart: getWeekStart(), mealId, answeredAt: Date.now() }));
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

// Check if the current week is over (it's a new week now, so last week is done)
export function isLastWeekOver(): boolean {
  // The reflection should be for the PREVIOUS week only
  return true; // Always allow since we track by weekNumber
}

export function getLastWeekNumber(): number {
  return getWeekNumber() - 1;
}

export function getLastWeekStart(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) - 7; // go back one week
  const lastMonday = new Date(today.getFullYear(), today.getMonth(), diff);
  return lastMonday.toISOString().split('T')[0];
}

export function generateInsight(meals: any[]): string | null {
  if (meals.length < 5) return null;
  const insights: string[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const caloriesByDay: number[] = [0, 0, 0, 0, 0, 0, 0];
  const countByDay: number[] = [0, 0, 0, 0, 0, 0, 0];
  const proteinByDay: number[] = [0, 0, 0, 0, 0, 0, 0];

  meals.forEach(meal => {
    const dayOfWeek = new Date(meal.date).getDay();
    caloriesByDay[dayOfWeek] += meal.calories;
    proteinByDay[dayOfWeek] += meal.protein || 0;
    countByDay[dayOfWeek]++;
  });

  const avgByDay = caloriesByDay.map((cal, i) => countByDay[i] > 0 ? cal / countByDay[i] : 0);
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
