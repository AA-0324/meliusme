import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Meal, Settings, getSettings, saveSettings, getAllMeals, addMeal, deleteMeal, deleteMealsByDate, updateGoals, Goals, getWaterIntake, setWaterIntake } from '@/lib/db';
import { getUserProfile, saveUserProfile, UserProfile } from '@/lib/userProfile';
import { getBodyProfile, saveBodyProfile, BodyProfile } from '@/lib/bodyGoals';
import { requestNotificationPermission, areNotificationsSupported } from '@/lib/notifications';
import { getStreakData, updateStreak, StreakData, getCurrentChallenge, Challenge, getEarnedBadges, Badge, awardBadge } from '@/lib/streaks';

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
  
  // Show meal logged toast
  showMealLoggedToast: boolean;
  setShowMealLoggedToast: (show: boolean) => void;
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
  const [showMealLoggedToast, setShowMealLoggedToast] = useState(false);
  
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

  const incrementWater = useCallback(() => {
    const newValue = todayWater + 1;
    setTodayWater(newValue);
    setWaterIntake(today, newValue);
  }, [todayWater, today]);

  const logMeal = useCallback(async (meal: Omit<Meal, 'id' | 'createdAt'>) => {
    const newMeal = await addMeal(meal);
    setMeals((prev) => [newMeal, ...prev]);
    
    // Update streak
    const updatedStreak = updateStreak(meal.date);
    setStreak(updatedStreak);
    
    // Check for first meal badge
    const currentBadges = getEarnedBadges();
    if (!currentBadges.some(b => b.id === 'first_meal')) {
      awardBadge('first_meal');
      setBadges(getEarnedBadges());
    }
    
    // Show toast
    setShowMealLoggedToast(true);
    
    return newMeal;
  }, []);

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
        showMealLoggedToast,
        setShowMealLoggedToast,
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
