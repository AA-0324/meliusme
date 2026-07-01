import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Meal, Settings, getSettings, saveSettings, getAllMeals, addMeal, deleteMeal, deleteMealsByDate, updateGoals, Goals, getWaterIntake, setWaterIntake, DEFAULT_GOALS, DEFAULT_WATER_GOAL, resetToBasicSettings } from '@/lib/db';
import { getUserProfile, saveUserProfile, UserProfile } from '@/lib/userProfile';
import { getBodyProfile, saveBodyProfile, BodyProfile, getAutoGoals } from '@/lib/bodyGoals';
import { requestNotificationPermission, areNotificationsSupported } from '@/lib/notifications';
import { getStreakData, updateStreak, StreakData, getCurrentChallenge, Challenge, getEarnedBadges, Badge, awardBadge, addXP, LevelUpResult, TempProUnlock, getTempProUnlocks, getXPData, XPData, getDailyChallenges, rollbackDailyXP, validateStreakFreshness } from '@/lib/streaks';
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
  let calories = 0, protein = 0, fiber = 0, sugar = 0;
  for (const m of allMeals) {
    if (m.date !== date) continue;
    calories += m.calories;
    protein += m.protein || 0;
    fiber += m.fiber || 0;
    sugar += m.sugar || 0;
  }
  return { calories, protein, fiber, sugar };
};

const DEFAULT_SETTINGS: Settings = {
  proStatus: false, devMode: false, darkMode: false, theme: 'default',
  goals: { ...DEFAULT_GOALS }, waterGoal: DEFAULT_WATER_GOAL, use24Hour: false, animationsEnabled: true, animationLevel: 'full',
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
  hasProFeature: (featureId: string) => boolean;
  animationsEnabled: boolean;
  motionEnabled: boolean;
  animationLevel: 'full' | 'reduced' | 'off';
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
  setAnimationLevel: (level: 'full' | 'reduced' | 'off') => void;
  setPersonalizedGoals: (enabled: boolean) => Promise<void>;
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
  const [levelUpQueue, setLevelUpQueue] = useState<LevelUpResult[]>([]);
  const levelUpPending = levelUpQueue[0] ?? null;

  const [bottomToast, setBottomToast] = useState<AppContextType['bottomToast']>({ open: false, message: '', variant: 'primary' });
  const toastQueueRef = useRef<Array<{ message: string; variant: ToastVariant }>>([]);

  const today = new Date().toISOString().split('T')[0];
  const [todayWater, setTodayWater] = useState(0);

  // Pro status only reflects an actual purchase or dev override. Temporary
  // level rewards unlock specific features individually via hasProFeature().
  const isPro = settings.proStatus || settings.devMode;
  const hasProFeature = useCallback(
    (featureId: string) => isPro || tempProUnlocks.some(u => u.featureId === featureId),
    [isPro, tempProUnlocks],
  );

  // Migrate legacy boolean preference to tri-state level.
  const animationLevel: 'full' | 'reduced' | 'off' =
    settings.animationLevel ?? (settings.animationsEnabled === false ? 'off' : 'full');
  const animationsEnabled = animationLevel === 'full';
  const motionEnabled = animationLevel !== 'off';

  const dismissLevelUp = useCallback(() => setLevelUpQueue(q => q.slice(1)), []);

  // Periodically prune expired temp Pro unlocks so the UI stays accurate.
  useEffect(() => {
    const refresh = async () => {
      setTempProUnlocks(await getTempProUnlocks());
      setStreak(await validateStreakFreshness());
    };
    const interval = window.setInterval(refresh, 60_000);
    const onVisible = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  // Clean up stale awarded-challenge keys for days other than today (one-time per session).
  useEffect(() => {
    const prefix = 'melius-daily-xp-awarded-';
    const todayKey = `${prefix}${today}`;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix) && k !== todayKey) localStorage.removeItem(k);
    }
  }, [today]);

  // Sync animations preference to window for motion.ts + CSS
  useEffect(() => {
    (window as any).__melius_animations_enabled = animationsEnabled;
    (window as any).__melius_motion_enabled = motionEnabled;
    (window as any).__melius_animation_level = animationLevel;
    document.documentElement.setAttribute('data-animations-disabled', String(!animationsEnabled));
    document.documentElement.setAttribute('data-animation-level', animationLevel);
  }, [animationsEnabled, motionEnabled, animationLevel]);

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
          getStreakData().then(() => validateStreakFreshness()),
          getCurrentChallenge(),
          getEarnedBadges(),
          getAllMeals(),
          getWaterIntake(today),
          getXPData(),
          getTempProUnlocks(),
        ]);

        let activeSettings = s;

        setSettingsState(activeSettings);
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

        // One-shot migration: reset all existing users back to Basic and clear
        // any Pro-only side-effects (theme, personalized goals + custom goals).
        const migrated = localStorage.getItem('meliusme-pro-reset-v1.3');
        if (!migrated) {
          const updated = await resetToBasicSettings();
          activeSettings = updated;
          setSettingsState(updated);
          localStorage.setItem('meliusme-pro-reset-v1.3', 'true');
        }

        // Check RevenueCat entitlement for Pro status
        try {
          const rcPro = await checkProEntitlement();
          if (rcPro && !activeSettings.proStatus) {
            const updated = await saveSettings({ proStatus: true });
            activeSettings = updated;
            setSettingsState(updated);
          }
        } catch (rcError) {
          console.warn('[RevenueCat] Entitlement check failed (non-blocking):', rcError);
        }

        // Apply auto-generated goals if the user has them but settings.goals is missing protein/fiber/sugar
        const autoGoals = await getAutoGoals();
        if (activeSettings.personalizedGoals && autoGoals && autoGoals.acceptedAt) {
          const currentGoals = activeSettings.goals;
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
              activeSettings = updatedSettings;
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
    const [s, c, b] = await Promise.all([validateStreakFreshness(), getCurrentChallenge(), getEarnedBadges()]);
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
      const updated = await resetToBasicSettings();
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
      // Turning Pro off must fully remove Pro-only state, including custom and personalized goals.
      const updated = await resetToBasicSettings();
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
    const updated = await saveSettings({
      animationsEnabled: enabled,
      animationLevel: enabled ? 'full' : 'off',
    });
    setSettingsState(updated);
  }, []);

  const setAnimationLevel = useCallback(async (level: 'full' | 'reduced' | 'off') => {
    const updated = await saveSettings({
      animationLevel: level,
      animationsEnabled: level !== 'off',
    });
    setSettingsState(updated);
  }, []);

  const setPersonalizedGoals = useCallback(async (enabled: boolean) => {
    const updated = await saveSettings({ personalizedGoals: enabled });
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

    const rolledBackXP = await rollbackDailyXP(todayStr, isPro);
    setXpData(rolledBackXP);

    // Daily challenge claims live in localStorage now (persistent).
    localStorage.removeItem(`melius-daily-xp-awarded-${todayStr}`);
    sessionStorage.removeItem(`melius-daily-xp-awarded-${todayStr}`); // legacy cleanup
    sessionStorage.removeItem(goalToastKey(todayStr));

    setMeals((prev) => prev.filter((m) => m.date !== todayStr));
    void deleteMealsByDate(todayStr);

    const remainingMeals = meals.filter(m => m.date !== todayStr);
    const updatedChallenge = await getCurrentChallenge(remainingMeals);
    setCurrentChallenge(updatedChallenge);
    setTempProUnlocks(await getTempProUnlocks());
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
  // Persistent across app reloads — sessionStorage would let users farm XP
  // by closing/reopening the app and re-claiming the same challenge.
  const getAwardedChallenges = useCallback((): Set<string> => {
    const key = `melius-daily-xp-awarded-${today}`;
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    try { return new Set(JSON.parse(raw)); } catch { return new Set(); }
  }, [today]);

  const markChallengeAwarded = useCallback((id: string) => {
    const key = `melius-daily-xp-awarded-${today}`;
    const awarded = getAwardedChallenges();
    awarded.add(id);
    localStorage.setItem(key, JSON.stringify([...awarded]));
  }, [today, getAwardedChallenges]);

  const checkAndAwardDailyChallengeXP = useCallback(async (
    mealTypes: string[], water: number, cals?: number, prot?: number
  ) => {
    const challenges = getDailyChallenges(mealTypes, water, settings.waterGoal, settings.goals, cals, prot);
    const awarded = getAwardedChallenges();
    for (const c of challenges) {
      if (c.completed && !awarded.has(c.id)) {
        // Mark BEFORE awarding to prevent double-grants from concurrent calls.
        markChallengeAwarded(c.id);
        const result = await addXP(c.xp, isPro, `challenge:${c.id}`);
        setXpData(result.xpData);
        if (result.leveledUp) {
          setLevelUpQueue(q => [...q, result]);
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
      setLevelUpQueue(q => [...q, levelResult]);
      if (levelResult.reward) {
        setTempProUnlocks(await getTempProUnlocks());
      }
    }

    const currentBadges = await getEarnedBadges();
    const earnedIds = new Set(currentBadges.map(b => b.id));
    let badgesChanged = false;
    if (!earnedIds.has('first_meal')) {
      await awardBadge('first_meal');
      badgesChanged = true;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayMealCountBefore = meals.reduce((c, m) => c + (m.date === todayStr ? 1 : 0), 0);
    if (todayMealCountBefore >= 2 && !earnedIds.has('meals_3')) {
      await awardBadge('meals_3');
      badgesChanged = true;
    }
    if (badgesChanged) setBadges(await getEarnedBadges());

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

  const value = useMemo<AppContextType>(() => ({
    settings, meals, isLoading, isPro, hasProFeature,
    animationsEnabled, motionEnabled, animationLevel,
    userProfile, setUserName, setUserAvatar,
    bodyProfile, updateBodyProfile: updateBodyProfileCb,
    streak, currentChallenge, badges, refreshStreak,
    todayWater, incrementWater,
    notificationsEnabled, toggleNotifications,
    setDevMode, setDarkMode, setPro, setTheme, setUse24Hour,
    setAnimationsEnabled, setAnimationLevel,
    setPersonalizedGoals, updateUserGoals, setWaterGoal: setWaterGoalCb, resetDailyData,
    refreshMeals, logMeal, removeMeal,
    bottomToast, showBottomToast, hideBottomToast,
    xpData, tempProUnlocks, levelUpPending, dismissLevelUp,
  }), [
    settings, meals, isLoading, isPro, hasProFeature,
    animationsEnabled, motionEnabled, animationLevel,
    userProfile, bodyProfile, streak, currentChallenge, badges,
    todayWater, notificationsEnabled, bottomToast,
    xpData, tempProUnlocks, levelUpPending,
    setUserName, setUserAvatar, updateBodyProfileCb, refreshStreak,
    incrementWater, toggleNotifications,
    setDevMode, setDarkMode, setPro, setTheme, setUse24Hour,
    setAnimationsEnabled, setAnimationLevel, setPersonalizedGoals,
    updateUserGoals, setWaterGoalCb, resetDailyData,
    refreshMeals, logMeal, removeMeal,
    showBottomToast, hideBottomToast, dismissLevelUp,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
