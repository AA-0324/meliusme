import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Meal, Settings, getSettings, saveSettings, getAllMeals, addMeal, deleteMeal, deleteMealsByDate, updateGoals, Goals, getWaterIntake, setWaterIntake } from '@/lib/db';
import { getUserProfile, saveUserProfile, UserProfile } from '@/lib/userProfile';
import { getBodyProfile, saveBodyProfile, BodyProfile, getAutoGoals } from '@/lib/bodyGoals';
import { requestNotificationPermission, areNotificationsSupported } from '@/lib/notifications';
import { getStreakData, updateStreak, StreakData, getCurrentChallenge, Challenge, getEarnedBadges, Badge, awardBadge, addXP, LevelUpResult, TempProUnlock, getTempProUnlocks, getXPData, XPData, getDailyChallenges } from '@/lib/streaks';
import { initEncryption } from '@/lib/crypto';
import { migrateAllToEncrypted } from '@/lib/encryptedStorage';
import { initRevenueCat, checkProEntitlement } from '@/lib/revenuecat';

type ToastVariant = 'primary' | 'success' | 'warning' | 'destructive' | 'challenge';

const goalToastKey = (date: string) => `meliusme-goal-toasts-${date}`;

const getGoalToastFlags = (date: string): Record<string, boolean> => {
  const stored = sessionStorage.getItem(goalToastKey(date));
  if (!stored) return {};
  try { return JSON.parse(stored); } catch { return {}; }
};

const setGoalToastFlag = (date: string, key: string) => {
  const flags = getGoalToastFlags(date);
  if (flags[key]) return;
  flags[key] = true;
  sessionStorage.setItem(goalToastKey(date), JSON.stringify(flags));
};

const getDailyTotals = (allMeals: Meal[], date: string) => {
  const dayMeals = allMeals.filter((m) => m.date === date);
  return {
    calories: dayMeals.reduce((sum, m) => sum + m.calories, 0),
    protein: dayMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
    fiber: dayMeals.reduce((sum, m) => sum + (m.fiber || 0), 0),
    sugar: dayMeals.reduce((sum, m) => sum + (m.sugar || 0), 0),
  };
};

const DEFAULT_SETTINGS: Settings = {
  proStatus: false, devMode: false, darkMode: false, theme: 'default',
  goals: { calories: 2000, protein: 50, fiber: 25, sugar: 50 }, waterGoal: 8, use24Hour: false, animationsEnabled: true,
};

const DEFAULT_STREAK: StreakData = { currentStreak: 0, longestStreak: 0, lastLogDate: null, streakHistory: [] };

const DEFAULT_CHALLENGE: Challenge = {
  id: '', name: '', title: '', description: '', target: 1, progress: 0, type: 'weekly', completed: false, startDate: '',
};

interface AppContextType {
  settings: Settings;
  meals: Meal[];
  isLoading: boolean;
  isPro: boolean;
  animationsEnabled: boolean;
  userProfile: UserProfile | null;
  setUserName: (name: string) => Promise<void>;
  setUserAvatar: (avatar: string) => Promise<void>;
  bodyProfile: BodyProfile | null;
  updateBodyProfile: (profile: Partial<BodyProfile>) => void;
  streak: StreakData;
  currentChallenge: Challenge;
  badges: Badge[];
  refreshStreak: () => void;
  todayWater: number;
  incrementWater: () => void;
  notificationsEnabled: boolean;
  toggleNotifications: () => Promise<void>;
  setDevMode: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setPro: (enabled: boolean) => void;
  setTheme: (theme: string) => void;
  setUse24Hour: (use24Hour: boolean) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  updateUserGoals: (goals: Partial<Goals>) => void;
  setWaterGoal: (glasses: number) => void;
  resetDailyData: () => void;
  refreshMeals: () => Promise<void>;
  logMeal: (meal: Omit<Meal, 'id' | 'createdAt'>) => Promise<Meal>;
  removeMeal: (id: string) => Promise<void>;
  bottomToast: { open: boolean; message: string; variant: ToastVariant };
  showBottomToast: (message: string, variant?: ToastVariant) => void;
  hideBottomToast: () => void;
  // Level system
  xpData: XPData;
  tempProUnlocks: TempProUnlock[];
  levelUpPending: LevelUpResult | null;
  dismissLevelUp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bodyProfile, setBodyProfile] = useState<BodyProfile | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [streak, setStreak] = useState<StreakData>(DEFAULT_STREAK);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge>(DEFAULT_CHALLENGE);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [xpData, setXpData] = useState<XPData>({ totalXP: 0, level: 1, xpToNextLevel: 100, currentLevelXP: 0 });
  const [tempProUnlocks, setTempProUnlocks] = useState<TempProUnlock[]>([]);
  const [levelUpPending, setLevelUpPending] = useState<LevelUpResult | null>(null);

  const [bottomToast, setBottomToast] = useState<AppContextType['bottomToast']>({ open: false, message: '', variant: 'primary' });
  const toastQueueRef = useRef<Array<{ message: string; variant: ToastVariant }>>([]);

  const today = new Date().toISOString().split('T')[0];
  const [todayWater, setTodayWater] = useState(0);

  const isPro = settings.proStatus || settings.devMode || tempProUnlocks.length > 0;
  const animationsEnabled = settings.animationsEnabled !== false;

  const dismissLevelUp = useCallback(() => setLevelUpPending(null), []);

  // Sync animations preference to window for motion.ts + CSS
  useEffect(() => {
    (window as any).__melius_animations_enabled = animationsEnabled;
    document.documentElement.setAttribute('data-animations-disabled', String(!animationsEnabled));
  }, [animationsEnabled]);

  // ─── Async init ──────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        await initEncryption();
        await migrateAllToEncrypted();
        
        // Initialize RevenueCat
        try {
          initRevenueCat();
        } catch (rcError) {
          console.warn('[RevenueCat] Init failed (non-blocking):', rcError);
        }

        const [s, profile, body, streakD, challenge, bdgs, allMeals, water, xp, unlocks] = await Promise.all([
          getSettings(),
          getUserProfile(),
          getBodyProfile(),
          getStreakData(),
          getCurrentChallenge(),
          getEarnedBadges(),
          getAllMeals(),
          getWaterIntake(today),
          getXPData(),
          getTempProUnlocks(),
        ]);

        setSettingsState(s);
        setUserProfile(profile);
        setBodyProfile(body);
        setXpData(xp);
        setTempProUnlocks(unlocks);
        setStreak(streakD);
        setBadges(bdgs);
        setMeals(allMeals);
        setTodayWater(water);

        const updatedChallenge = await getCurrentChallenge(allMeals);
        setCurrentChallenge(updatedChallenge);

        const migrated = localStorage.getItem('meliusme-pro-reset-v1.1');
        if (!migrated && s.proStatus) {
          const updated = await saveSettings({ proStatus: false, theme: 'default' });
          setSettingsState(updated);
        }
        if (!migrated) localStorage.setItem('meliusme-pro-reset-v1.1', 'true');

        // Check RevenueCat entitlement for Pro status
        try {
          const rcPro = await checkProEntitlement();
          if (rcPro && !s.proStatus) {
            const updated = await saveSettings({ proStatus: true });
            setSettingsState(updated);
          }
        } catch (rcError) {
          console.warn('[RevenueCat] Entitlement check failed (non-blocking):', rcError);
        }

        // Apply auto-generated goals if the user has them but settings.goals is missing protein/fiber/sugar
        const autoGoals = await getAutoGoals();
        if (autoGoals && autoGoals.acceptedAt) {
          const currentGoals = s.goals;
          const needsUpdate =
            !currentGoals.protein || !currentGoals.fiber || !currentGoals.sugar;
          if (needsUpdate) {
            const goalsUpdate: Partial<Goals> = {};
            if (!currentGoals.protein && autoGoals.protein) goalsUpdate.protein = autoGoals.protein;
            if (!currentGoals.fiber && autoGoals.fiber) goalsUpdate.fiber = autoGoals.fiber;
            if (!currentGoals.sugar && autoGoals.sugarLimit) goalsUpdate.sugar = autoGoals.sugarLimit;
            if (!currentGoals.calories && autoGoals.calories) goalsUpdate.calories = autoGoals.calories;
            if (Object.keys(goalsUpdate).length > 0) {
              const updatedSettings = await updateGoals(goalsUpdate);
              setSettingsState(updatedSettings);
            }
          }
        }

      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Dark mode / theme effect
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    root.classList.remove('theme-ocean', 'theme-sunset', 'theme-berry', 'theme-midnight', 'theme-cyber');
    if (isPro && settings.theme && settings.theme !== 'default') root.classList.add(`theme-${settings.theme}`);
  }, [settings.darkMode, settings.theme, isPro]);

  useEffect(() => {
    if (areNotificationsSupported() && Notification.permission === 'granted') setNotificationsEnabled(true);
  }, []);

  const refreshMeals = useCallback(async () => {
    const allMeals = await getAllMeals();
    setMeals(allMeals);
  }, []);

  const refreshStreak = useCallback(async () => {
    const [s, c, b] = await Promise.all([getStreakData(), getCurrentChallenge(), getEarnedBadges()]);
    setStreak(s);
    setCurrentChallenge(c);
    setBadges(b);
  }, []);

  const setUserName = useCallback(async (name: string) => {
    const updated = await saveUserProfile({ name });
    setUserProfile(updated);
  }, []);

  const setUserAvatar = useCallback(async (avatar: string) => {
    const updated = await saveUserProfile({ avatar });
    setUserProfile(updated);
  }, []);

  const updateBodyProfileCb = useCallback(async (profile: Partial<BodyProfile>) => {
    const updated = await saveBodyProfile(profile);
    setBodyProfile(updated);
  }, []);

  const setDevMode = useCallback(async (enabled: boolean) => {
    if (!enabled && !settings.proStatus) {
      const updated = await saveSettings({ devMode: enabled, theme: 'default' });
      setSettingsState(updated);
    } else {
      const updated = await saveSettings({ devMode: enabled });
      setSettingsState(updated);
    }
  }, [settings.proStatus]);

  const setDarkMode = useCallback(async (enabled: boolean) => {
    const updated = await saveSettings({ darkMode: enabled });
    setSettingsState(updated);
  }, []);

  const setPro = useCallback(async (enabled: boolean) => {
    if (!enabled) {
      const updated = await saveSettings({ proStatus: enabled, theme: 'default' });
      setSettingsState(updated);
    } else {
      const updated = await saveSettings({ proStatus: enabled });
      setSettingsState(updated);
    }
  }, []);

  const setTheme = useCallback(async (theme: string) => {
    const updated = await saveSettings({ theme });
    setSettingsState(updated);
  }, []);

  const setUse24Hour = useCallback(async (use24Hour: boolean) => {
    const updated = await saveSettings({ use24Hour });
    setSettingsState(updated);
  }, []);

  const setAnimationsEnabled = useCallback(async (enabled: boolean) => {
    const updated = await saveSettings({ animationsEnabled: enabled });
    setSettingsState(updated);
  }, []);

  const updateUserGoals = useCallback(async (goals: Partial<Goals>) => {
    const updated = await updateGoals(goals);
    setSettingsState(updated);
  }, []);

  const setWaterGoalCb = useCallback(async (glasses: number) => {
    const updated = await saveSettings({ waterGoal: glasses });
    setSettingsState(updated);
  }, []);

  const resetDailyData = useCallback(async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setTodayWater(0);
    await setWaterIntake(todayStr, 0);
    sessionStorage.removeItem(`melius-confetti-${todayStr}`);
    
    // Rollback XP earned today
    const { rollbackDailyXP } = await import('@/lib/streaks');
    const rolledBackXP = await rollbackDailyXP(todayStr, isPro);
    setXpData(rolledBackXP);
    
    // Clear daily challenge awards for today
    sessionStorage.removeItem(`melius-daily-xp-awarded-${todayStr}`);
    
    // Clear goal toast flags so they can re-trigger
    sessionStorage.removeItem(goalToastKey(todayStr));
    
    // Delete today's meals and update state
    setMeals((prev) => prev.filter((m) => m.date !== todayStr));
    void deleteMealsByDate(todayStr);
    
    // Recalculate weekly challenge progress without today's meals
    const remainingMeals = meals.filter(m => m.date !== todayStr);
    const { getCurrentChallenge: getChallenge } = await import('@/lib/streaks');
    const updatedChallenge = await getChallenge(remainingMeals);
    setCurrentChallenge(updatedChallenge);
  }, [isPro, meals]);

  const toggleNotifications = useCallback(async () => {
    if (!areNotificationsSupported()) return;
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
    } else {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
    }
  }, [notificationsEnabled]);

  const showBottomToast = useCallback((message: string, variant: ToastVariant = 'primary') => {
    setBottomToast((prev) => {
      if (prev.open) {
        toastQueueRef.current.push({ message, variant });
        return prev;
      }
      return { open: true, message, variant };
    });
  }, []);

  const hideBottomToast = useCallback(() => {
    setBottomToast(prev => ({ ...prev, open: false }));
    // Show next queued toast after a short delay for smooth stacking
    setTimeout(() => {
      const next = toastQueueRef.current.shift();
      if (next) {
        setBottomToast({ open: true, message: next.message, variant: next.variant });
      }
    }, 400);
  }, []);

  // ─── Daily challenge XP tracking ──────────────────────
  const getAwardedChallenges = useCallback((): Set<string> => {
    const key = `melius-daily-xp-awarded-${today}`;
    const raw = sessionStorage.getItem(key);
    if (!raw) return new Set();
    try { return new Set(JSON.parse(raw)); } catch { return new Set(); }
  }, [today]);

  const markChallengeAwarded = useCallback((id: string) => {
    const key = `melius-daily-xp-awarded-${today}`;
    const awarded = getAwardedChallenges();
    awarded.add(id);
    sessionStorage.setItem(key, JSON.stringify([...awarded]));
  }, [today, getAwardedChallenges]);

  const checkAndAwardDailyChallengeXP = useCallback(async (
    mealTypes: string[], water: number, cals?: number, prot?: number
  ) => {
    const challenges = getDailyChallenges(mealTypes, water, settings.waterGoal, settings.goals, cals, prot);
    const awarded = getAwardedChallenges();
    for (const c of challenges) {
      if (c.completed && !awarded.has(c.id)) {
        markChallengeAwarded(c.id);
        const result = await addXP(c.xp, isPro, `challenge:${c.id}`);
        setXpData(result.xpData);
        if (result.leveledUp) {
          setLevelUpPending(result);
          if (result.reward) {
            setTempProUnlocks(await getTempProUnlocks());
          }
        }
        showBottomToast(`${c.title} — Complete! +${c.xp} XP`, 'challenge');
      }
    }
  }, [settings.waterGoal, settings.goals, isPro, getAwardedChallenges, markChallengeAwarded, showBottomToast]);

  const incrementWater = useCallback(async () => {
    const newValue = todayWater + 1;
    setTodayWater(newValue);
    await setWaterIntake(today, newValue);
    if (newValue >= settings.waterGoal) {
      const key = `water_complete_${today}`;
      const flags = getGoalToastFlags(today);
      if (!flags[key]) {
        setGoalToastFlag(today, key);
        showBottomToast('Water goal completed!', 'success');
      }
    }
    // Check daily challenges after water update
    const todayMealTypes = meals.filter(m => m.date === today).map(m => m.mealType);
    const todayTotals = getDailyTotals(meals, today);
    await checkAndAwardDailyChallengeXP(todayMealTypes, newValue, todayTotals.calories, todayTotals.protein);
    // Refresh the weekly challenge — water-based challenges (e.g. Hydration Hero)
    // depend on today's water count.
    const updatedChallenge = await getCurrentChallenge(meals);
    setCurrentChallenge(updatedChallenge);
  }, [todayWater, today, settings.waterGoal, showBottomToast, meals, checkAndAwardDailyChallengeXP]);

  const logMeal = useCallback(async (meal: Omit<Meal, 'id' | 'createdAt'>) => {
    const prevTotals = getDailyTotals(meals, meal.date);
    const newMeal = await addMeal(meal);
    const updatedMeals = [newMeal, ...meals];
    setMeals(updatedMeals);

    const updatedStreak = await updateStreak(meal.date);
    setStreak(updatedStreak);

    const updatedChallenge = await getCurrentChallenge(updatedMeals);
    setCurrentChallenge(updatedChallenge);

    const levelResult = await addXP(10, isPro, 'meal_log');
    setXpData(levelResult.xpData);
    if (levelResult.leveledUp) {
      setLevelUpPending(levelResult);
      if (levelResult.reward) {
        setTempProUnlocks(await getTempProUnlocks());
      }
    }

    const currentBadges = await getEarnedBadges();
    if (!currentBadges.some(b => b.id === 'first_meal')) {
      await awardBadge('first_meal');
      setBadges(await getEarnedBadges());
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayMeals = meals.filter(m => m.date === todayStr);
    if (todayMeals.length >= 2 && !currentBadges.some(b => b.id === 'meals_3')) {
      await awardBadge('meals_3');
      setBadges(await getEarnedBadges());
    }

    showBottomToast('Meal logged!', 'primary');

    const nextTotals = {
      calories: prevTotals.calories + newMeal.calories,
      protein: prevTotals.protein + (newMeal.protein || 0),
      fiber: prevTotals.fiber + (newMeal.fiber || 0),
      sugar: prevTotals.sugar + (newMeal.sugar || 0),
    };

    const dateKey = meal.date;
    const flags = getGoalToastFlags(dateKey);

    const calGoal = settings.goals.calories;
    if (!flags.calories_done && prevTotals.calories < calGoal && nextTotals.calories >= calGoal) {
      setGoalToastFlag(dateKey, 'calories_done');
      showBottomToast('Daily calorie goal completed!', 'success');
    }
    if (!flags.calories_over && prevTotals.calories <= calGoal && nextTotals.calories > calGoal) {
      setGoalToastFlag(dateKey, 'calories_over');
      showBottomToast("You're over your calorie goal — consider a lighter choice.", 'warning');
    }

    if (settings.goals.protein) {
      const g = settings.goals.protein;
      if (!flags.protein_done && prevTotals.protein < g && nextTotals.protein >= g) {
        setGoalToastFlag(dateKey, 'protein_done');
        showBottomToast('Protein goal completed!', 'success');
      }
    }
    if (settings.goals.fiber) {
      const g = settings.goals.fiber;
      if (!flags.fiber_done && prevTotals.fiber < g && nextTotals.fiber >= g) {
        setGoalToastFlag(dateKey, 'fiber_done');
        showBottomToast('Fiber goal completed!', 'success');
      }
    }
    if (settings.goals.sugar) {
      const g = settings.goals.sugar;
      if (!flags.sugar_over && prevTotals.sugar <= g && nextTotals.sugar > g) {
        setGoalToastFlag(dateKey, 'sugar_over');
        showBottomToast("You've exceeded your sugar limit today.", 'warning');
      }
    }

    // Check daily challenges after meal log
    const allMealTypes = updatedMeals.filter(m => m.date === today).map(m => m.mealType);
    await checkAndAwardDailyChallengeXP(allMealTypes, todayWater, nextTotals.calories, nextTotals.protein);

    return newMeal;
  }, [meals, settings.goals, showBottomToast, isPro, today, todayWater, checkAndAwardDailyChallengeXP]);

  const removeMeal = useCallback(async (id: string) => {
    await deleteMeal(id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        settings, meals, isLoading, isPro, animationsEnabled,
        userProfile, setUserName, setUserAvatar,
        bodyProfile, updateBodyProfile: updateBodyProfileCb,
        streak, currentChallenge, badges, refreshStreak,
        todayWater, incrementWater,
        notificationsEnabled, toggleNotifications,
        setDevMode, setDarkMode, setPro, setTheme, setUse24Hour, setAnimationsEnabled,
        updateUserGoals, setWaterGoal: setWaterGoalCb, resetDailyData,
        refreshMeals, logMeal, removeMeal,
        bottomToast, showBottomToast, hideBottomToast,
        xpData, tempProUnlocks, levelUpPending, dismissLevelUp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
