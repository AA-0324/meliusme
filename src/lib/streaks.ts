// Streak and Gamification System for MeliusMe

const STREAK_KEY = 'meliusme-streak';
const CHALLENGES_KEY = 'meliusme-challenges';
const BADGES_KEY = 'meliusme-badges';
const REFLECTION_KEY = 'meliusme-reflection';

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
    // Convert old format to new
    if (data.weekStart) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function saveLastReflection(weekNumber: number, mealId: string): void {
  const data: ReflectionData = {
    weekNumber,
    mealId,
    answeredAt: Date.now(),
  };
  localStorage.setItem(REFLECTION_KEY, JSON.stringify(data));
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string | null; // YYYY-MM-DD
  streakHistory: string[]; // Array of dates with meals logged
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
  title: string; // For display
  description: string;
  target: number;
  progress: number;
  type: 'daily' | 'weekly';
  completed: boolean;
  startDate: string;
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

// Weekly challenges - rotates each week
export const WEEKLY_CHALLENGES = [
  { id: 'log_3_daily', name: 'Log 3 meals today', description: 'Log breakfast, lunch, and dinner', target: 3 },
  { id: 'in_range_5', name: 'Stay in calorie range', description: 'Stay within calorie goal for 5 days', target: 5 },
  { id: 'dinner_week', name: 'Log every dinner', description: 'Log dinner each day this week', target: 7 },
  { id: 'protein_power', name: 'Protein packed week', description: 'Meet protein goal 5 times', target: 5 },
  { id: 'hydrate_week', name: 'Hydration hero', description: 'Hit water goal 5 times', target: 5 },
  { id: 'healthy_meals', name: 'No warnings week', description: 'Log 10 meals without health warnings', target: 10 },
];

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
  if (!stored) {
    return { currentStreak: 0, longestStreak: 0, lastLogDate: null, streakHistory: [] };
  }
  try {
    return JSON.parse(stored);
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastLogDate: null, streakHistory: [] };
  }
}

// Save streak data
export function saveStreakData(data: StreakData): void {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

// Update streak when a meal is logged
export function updateStreak(mealDate: string): StreakData {
  const data = getStreakData();
  const today = new Date().toISOString().split('T')[0];
  
  // Already logged today
  if (data.streakHistory.includes(mealDate)) {
    return data;
  }
  
  // Add to history
  data.streakHistory.push(mealDate);
  
  // Calculate streak
  if (data.lastLogDate === null) {
    // First ever log
    data.currentStreak = 1;
  } else {
    const lastDate = new Date(data.lastLogDate);
    const currentDate = new Date(mealDate);
    const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day
      data.currentStreak++;
    } else if (diffDays === 0) {
      // Same day, no change
    } else {
      // Streak broken
      data.currentStreak = 1;
    }
  }
  
  // Update longest streak
  if (data.currentStreak > data.longestStreak) {
    data.longestStreak = data.currentStreak;
  }
  
  data.lastLogDate = mealDate;
  saveStreakData(data);
  
  // Check for streak badges
  checkStreakBadges(data.currentStreak);
  
  return data;
}

// Get earned badges
export function getEarnedBadges(): Badge[] {
  const stored = localStorage.getItem(BADGES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Award a badge
export function awardBadge(badgeId: string): Badge | null {
  const earned = getEarnedBadges();
  if (earned.some(b => b.id === badgeId)) return null; // Already earned
  
  const badge = AVAILABLE_BADGES.find(b => b.id === badgeId);
  if (!badge) return null;
  
  const earnedBadge = { ...badge, earnedAt: Date.now() };
  earned.push(earnedBadge);
  localStorage.setItem(BADGES_KEY, JSON.stringify(earned));
  
  return earnedBadge;
}

// Check and award streak badges
export function checkStreakBadges(streak: number): Badge | null {
  if (streak >= 100) return awardBadge('streak_100');
  if (streak >= 60) return awardBadge('streak_60');
  if (streak >= 30) return awardBadge('streak_30');
  if (streak >= 14) return awardBadge('streak_14');
  if (streak >= 7) return awardBadge('streak_7');
  return null;
}

// Get current week's challenge
export function getCurrentChallenge(): Challenge {
  const stored = localStorage.getItem(CHALLENGES_KEY);
  const weekStart = getWeekStart();
  
  if (stored) {
    try {
      const challenge = JSON.parse(stored) as Challenge;
      if (challenge.startDate === weekStart) {
        return challenge;
      }
    } catch {}
  }
  
  // Create new challenge for this week
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
  
  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenge));
  return challenge;
}

// Update challenge progress
export function updateChallengeProgress(amount: number = 1): Challenge {
  const challenge = getCurrentChallenge();
  challenge.progress = Math.min(challenge.progress + amount, challenge.target);
  challenge.completed = challenge.progress >= challenge.target;
  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenge));
  return challenge;
}

// Get week's reflection question
export function getWeeklyReflectionQuestion(): string {
  const weekNumber = getWeekNumber();
  const questionIndex = weekNumber % REFLECTION_QUESTIONS.length;
  return REFLECTION_QUESTIONS[questionIndex];
}

// Check if reflection was answered this week
export function wasReflectionAnswered(): boolean {
  const stored = localStorage.getItem(REFLECTION_KEY);
  if (!stored) return false;
  try {
    const data = JSON.parse(stored);
    return data.weekStart === getWeekStart();
  } catch {
    return false;
  }
}

// Save reflection answer
export function saveReflectionAnswer(mealId: string): void {
  localStorage.setItem(REFLECTION_KEY, JSON.stringify({
    weekStart: getWeekStart(),
    mealId,
    answeredAt: Date.now(),
  }));
}

// Helper: Get week start date (Monday)
function getWeekStart(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Helper: Get week number of year
function getWeekNumber(): number {
  const today = new Date();
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
  const pastDaysOfYear = (today.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Generate a micro-insight based on meal data (simplified version)
export function generateInsight(meals: any[]): string | null {
  if (meals.length < 5) return null;
  
  const insights: string[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Calculate calories by day of week
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
  
  if (maxCalDay >= 0 && avgByDay[maxCalDay] > 0) {
    insights.push(`You tend to eat more calories on ${dayNames[maxCalDay]}s.`);
  }
  
  if (maxProteinDay >= 0 && proteinByDay[maxProteinDay] > 0) {
    insights.push(`Your highest-protein day was ${dayNames[maxProteinDay]}.`);
  }
  
  // Check breakfast consistency
  const breakfastDays = new Set(meals.filter(m => m.mealType === 'breakfast').map(m => m.date)).size;
  const totalDays = new Set(meals.map(m => m.date)).size;
  if (breakfastDays > totalDays * 0.7) {
    insights.push('You log breakfast more consistently than other meals. Great habit!');
  }
  
  // Meal count
  const avgMeals = meals.length / Math.max(totalDays, 1);
  if (avgMeals > 0) {
    insights.push(`You average ${avgMeals.toFixed(1)} meals per day.`);
  }
  
  // Return a random insight
  if (insights.length === 0) return null;
  return insights[Math.floor(Math.random() * insights.length)];
}
