import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Meal, Settings, getSettings, saveSettings, getAllMeals, addMeal, deleteMeal, deleteMealsByDate, updateGoals, Goals, getWaterIntake, setWaterIntake } from '@/lib/db';
import { getUserProfile, saveUserProfile, UserProfile } from '@/lib/userProfile';
import { getBodyProfile, saveBodyProfile, BodyProfile } from '@/lib/bodyGoals';
import { requestNotificationPermission, areNotificationsSupported } from '@/lib/notifications';
import { getStreakData, updateStreak, StreakData, getCurrentChallenge, updateChallengeProgress, Challenge, getEarnedBadges, Badge, awardBadge } from '@/lib/streaks';

type ToastVariant = 'primary' | 'success' | 'warning' | 'destructive';

const goalToastKey = (date: string) => `meliusme-goal-toasts-${date}`;
const getGoalToastFlags = (date: string): Record<string, boolean> => {
  const stored = localStorage.getItem(goalToastKey(date));
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
};

const setGoalToastFlag = (date: string, key: string) => {
  const flags = getGoalToastFlags(date);
  if (flags[key]) return;
  flags[key] = true;
  localStorage.setItem(goalToastKey(date), JSON.stringify(flags));
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

interface AppContextType {
  settings: Settings;
  meals: Meal[];
  isLoading: boolean;
  isPro: boolean;
  
  // User profile
  userProfile: UserProfile | null;
  setUserName: (name: string) => void;
  
  // Body profile
  bodyProfile: BodyProfile | null;
  updateBodyProfile: (profile: Partial<BodyProfile>) => void;
  
  // Streak & gamification
  streak: StreakData;
  currentChallenge: Challenge;
  badges: Badge[];
  refreshStreak: () => void;
  
  // Water tracking
  todayWater: number;
  incrementWater: () => void;
  
  // Notifications
  notificationsEnabled: boolean;
  toggleNotifications: () => Promise<void>;
  
  // Settings actions
  setDevMode: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setPro: (enabled: boolean) => void;
  setTheme: (theme: string) => void;
  setUse24Hour: (use24Hour: boolean) => void;
  updateUserGoals: (goals: Partial<Goals>) => void;
  setWaterGoal: (glasses: number) => void;
  resetDailyData: () => void;
  
  // Meal actions
  refreshMeals: () => Promise<void>;
  logMeal: (meal: Omit<Meal, 'id' | 'createdAt'>) => Promise<Meal>;
  removeMeal: (id: string) => Promise<void>;

  // Bottom toast notifications
  bottomToast: { open: boolean; message: string; variant: ToastVariant };
  showBottomToast: (message: string, variant?: ToastVariant) => void;
  hideBottomToast: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(() => getSettings());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getUserProfile());
  const [bodyProfile, setBodyProfile] = useState<BodyProfile | null>(() => getBodyProfile());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [streak, setStreak] = useState<StreakData>(() => getStreakData());
  const [currentChallenge, setCurrentChallenge] = useState<Challenge>(() => getCurrentChallenge());
  const [badges, setBadges] = useState<Badge[]>(() => getEarnedBadges());

  const [bottomToast, setBottomToast] = useState<AppContextType['bottomToast']>({
    open: false,
    message: '',
    variant: 'primary',
  });
  const toastQueueRef = useRef<Array<{ message: string; variant: ToastVariant }>>([]);
  
  const today = new Date().toISOString().split('T')[0];
  const [todayWater, setTodayWater] = useState(() => getWaterIntake(today));

  // Derived state: Pro status
  const isPro = settings.proStatus || settings.devMode;

  // Apply dark mode and theme
  useEffect(() => {
    const root = document.documentElement;
    
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    root.classList.remove('theme-ocean', 'theme-sunset', 'theme-berry', 'theme-midnight', 'theme-cyber');
    if (isPro && settings.theme && settings.theme !== 'default') {
      root.classList.add(`theme-${settings.theme}`);
    }
  }, [settings.darkMode, settings.theme, isPro]);

  // Check notification permission on load
  useEffect(() => {
    if (areNotificationsSupported() && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const allMeals = await getAllMeals();
        setMeals(allMeals);
      } catch (error) {
        console.error('Failed to load meals:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const refreshMeals = useCallback(async () => {
    const allMeals = await getAllMeals();
    setMeals(allMeals);
  }, []);

  const refreshStreak = useCallback(() => {
    setStreak(getStreakData());
    setCurrentChallenge(getCurrentChallenge());
    setBadges(getEarnedBadges());
  }, []);

  const setUserName = useCallback((name: string) => {
    const updated = saveUserProfile({ name });
    setUserProfile(updated);
  }, []);

  const updateBodyProfile = useCallback((profile: Partial<BodyProfile>) => {
    const updated = saveBodyProfile(profile);
    setBodyProfile(updated);
  }, []);

  const setDevMode = useCallback((enabled: boolean) => {
    if (!enabled && !settings.proStatus) {
      const updated = saveSettings({ devMode: enabled, theme: 'default' });
      setSettingsState(updated);
    } else {
      const updated = saveSettings({ devMode: enabled });
      setSettingsState(updated);
    }
  }, [settings.proStatus]);

  const setDarkMode = useCallback((enabled: boolean) => {
    const updated = saveSettings({ darkMode: enabled });
    setSettingsState(updated);
  }, []);

  const setPro = useCallback((enabled: boolean) => {
    if (!enabled) {
      const updated = saveSettings({ proStatus: enabled, theme: 'default' });
      setSettingsState(updated);
    } else {
      const updated = saveSettings({ proStatus: enabled });
      setSettingsState(updated);
    }
  }, []);

  const setTheme = useCallback((theme: string) => {
    const updated = saveSettings({ theme });
    setSettingsState(updated);
  }, []);

  const setUse24Hour = useCallback((use24Hour: boolean) => {
    const updated = saveSettings({ use24Hour });
    setSettingsState(updated);
  }, []);

  const updateUserGoals = useCallback((goals: Partial<Goals>) => {
    const updated = updateGoals(goals);
    setSettingsState(updated);
  }, []);

  const setWaterGoal = useCallback((glasses: number) => {
    const updated = saveSettings({ waterGoal: glasses });
    setSettingsState(updated);
  }, []);

  const resetDailyData = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Reset water
    setTodayWater(0);
    setWaterIntake(todayStr, 0);
    sessionStorage.removeItem(`melius-confetti-${todayStr}`);

    // Remove today's meals
    setMeals((prev) => prev.filter((m) => m.date !== todayStr));
    void deleteMealsByDate(todayStr);
  }, []);

  const toggleNotifications = useCallback(async () => {
    if (!areNotificationsSupported()) {
      return;
    }
    
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
    setBottomToast((prev) => {
      const next = toastQueueRef.current.shift();
      if (next) {
        return { open: true, message: next.message, variant: next.variant };
      }
      return { ...prev, open: false };
    });
  }, []);

  const incrementWater = useCallback(() => {
    const newValue = todayWater + 1;
    setTodayWater(newValue);
    setWaterIntake(today, newValue);

    // Notify on completion (once per day)
    if (newValue >= settings.waterGoal) {
      const key = `water_complete_${today}`;
      const flags = getGoalToastFlags(today);
      if (!flags[key]) {
        setGoalToastFlag(today, key);
        showBottomToast('Water goal completed!', 'success');
      }
    }
  }, [todayWater, today, settings.waterGoal, showBottomToast]);

  const logMeal = useCallback(async (meal: Omit<Meal, 'id' | 'createdAt'>) => {
    const prevTotals = getDailyTotals(meals, meal.date);

    const newMeal = await addMeal(meal);
    setMeals((prev) => [newMeal, ...prev]);
    
    // Update streak
    const updatedStreak = updateStreak(meal.date);
    setStreak(updatedStreak);
    
    // Update challenge progress (legacy single challenge)
    const updatedChallenge = updateChallengeProgress(1);
    setCurrentChallenge(updatedChallenge);
    
    // Check for first meal badge
    const currentBadges = getEarnedBadges();
    if (!currentBadges.some(b => b.id === 'first_meal')) {
      awardBadge('first_meal');
      setBadges(getEarnedBadges());
    }
    
    // Check for triple threat badge (3 meals in one day)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMeals = meals.filter(m => m.date === todayStr);
    if (todayMeals.length >= 2 && !currentBadges.some(b => b.id === 'meals_3')) {
      awardBadge('meals_3');
      setBadges(getEarnedBadges());
    }
    
    // Bottom notifications (queued)
    showBottomToast('Meal logged!', 'primary');

    // Goal completion notifications (once per day per goal)
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

    if (isPro && settings.goals.protein) {
      const g = settings.goals.protein;
      if (!flags.protein_done && prevTotals.protein < g && nextTotals.protein >= g) {
        setGoalToastFlag(dateKey, 'protein_done');
        showBottomToast('Protein goal completed!', 'success');
      }
    }

    if (isPro && settings.goals.fiber) {
      const g = settings.goals.fiber;
      if (!flags.fiber_done && prevTotals.fiber < g && nextTotals.fiber >= g) {
        setGoalToastFlag(dateKey, 'fiber_done');
        showBottomToast('Fiber goal completed!', 'success');
      }
    }

    if (isPro && settings.goals.sugar) {
      // Sugar is a limit, not a target — warn once when crossing limit
      const g = settings.goals.sugar;
      if (!flags.sugar_over && prevTotals.sugar <= g && nextTotals.sugar > g) {
        setGoalToastFlag(dateKey, 'sugar_over');
        showBottomToast("You've exceeded your sugar limit today.", 'warning');
      }
    }
    
    return newMeal;
  }, [meals, settings.goals, showBottomToast, isPro]);

  const removeMeal = useCallback(async (id: string) => {
    await deleteMeal(id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        settings,
        meals,
        isLoading,
        isPro,
        userProfile,
        setUserName,
        bodyProfile,
        updateBodyProfile,
        streak,
        currentChallenge,
        badges,
        refreshStreak,
        todayWater,
        incrementWater,
        notificationsEnabled,
        toggleNotifications,
        setDevMode,
        setDarkMode,
        setPro,
        setTheme,
        setUse24Hour,
        updateUserGoals,
        setWaterGoal,
        resetDailyData,
        refreshMeals,
        logMeal,
        removeMeal,
        bottomToast,
        showBottomToast,
        hideBottomToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
