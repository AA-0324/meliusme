import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Meal, Settings, getSettings, saveSettings, getAllMeals, addMeal, deleteMeal, updateGoals, Goals, getWaterIntake, setWaterIntake } from '@/lib/db';
import { getUserProfile, saveUserProfile, UserProfile } from '@/lib/userProfile';
import { requestNotificationPermission, areNotificationsSupported } from '@/lib/notifications';

interface AppContextType {
  settings: Settings;
  meals: Meal[];
  isLoading: boolean;
  isPro: boolean;
  
  // User profile
  userProfile: UserProfile | null;
  setUserName: (name: string) => void;
  
  // Water tracking
  todayWater: number;
  incrementWater: () => void;
  decrementWater: () => void;
  
  // Notifications
  notificationsEnabled: boolean;
  toggleNotifications: () => Promise<void>;
  
  // Settings actions
  setDevMode: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setPro: (enabled: boolean) => void;
  setTheme: (theme: string) => void;
  updateUserGoals: (goals: Partial<Goals>) => void;
  setWaterGoal: (glasses: number) => void;
  resetDailyData: () => void;
  
  // Meal actions
  refreshMeals: () => Promise<void>;
  logMeal: (meal: Omit<Meal, 'id' | 'createdAt'>) => Promise<Meal>;
  removeMeal: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(getSettings);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getUserProfile());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  const [todayWater, setTodayWater] = useState(() => getWaterIntake(today));

  // Derived state: Pro status is true if either proStatus is true OR devMode is true
  const isPro = settings.proStatus || settings.devMode;

  // Apply dark mode and theme
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply dark mode
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Apply theme - only if Pro
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

  const setUserName = useCallback((name: string) => {
    const updated = saveUserProfile({ name });
    setUserProfile(updated);
  }, []);

  const setDevMode = useCallback((enabled: boolean) => {
    // When disabling dev mode and user is not a paid Pro, reset theme
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
    // When disabling Pro, reset theme to default
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

  const updateUserGoals = useCallback((goals: Partial<Goals>) => {
    const updated = updateGoals(goals);
    setSettingsState(updated);
  }, []);

  const setWaterGoal = useCallback((glasses: number) => {
    const updated = saveSettings({ waterGoal: glasses });
    setSettingsState(updated);
  }, []);

  const resetDailyData = useCallback(() => {
    setTodayWater(0);
    setWaterIntake(today, 0);
    // Clear confetti flag for today
    sessionStorage.removeItem(`melius-confetti-${today}`);
  }, [today]);

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

  const decrementWater = useCallback(() => {
    const newValue = Math.max(0, todayWater - 1);
    setTodayWater(newValue);
    setWaterIntake(today, newValue);
  }, [todayWater, today]);

  const logMeal = useCallback(async (meal: Omit<Meal, 'id' | 'createdAt'>) => {
    const newMeal = await addMeal(meal);
    setMeals((prev) => [newMeal, ...prev]);
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
        todayWater,
        incrementWater,
        decrementWater,
        notificationsEnabled,
        toggleNotifications,
        setDevMode,
        setDarkMode,
        setPro,
        setTheme,
        updateUserGoals,
        setWaterGoal,
        resetDailyData,
        refreshMeals,
        logMeal,
        removeMeal,
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