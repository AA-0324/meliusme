import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Meal, Settings, getSettings, saveSettings, getAllMeals, addMeal, deleteMeal, updateGoals, Goals, getWaterIntake, setWaterIntake } from '@/lib/db';

interface AppContextType {
  settings: Settings;
  meals: Meal[];
  isLoading: boolean;
  isPro: boolean;
  
  // Water tracking
  todayWater: number;
  incrementWater: () => void;
  decrementWater: () => void;
  
  // Settings actions
  setDevMode: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setPro: (enabled: boolean) => void;
  updateUserGoals: (goals: Partial<Goals>) => void;
  setWaterGoal: (glasses: number) => void;
  
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
  
  const today = new Date().toISOString().split('T')[0];
  const [todayWater, setTodayWater] = useState(() => getWaterIntake(today));

  // Derived state: Pro status is true if either proStatus is true OR devMode is true
  const isPro = settings.proStatus || settings.devMode;

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

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

  const setDevMode = useCallback((enabled: boolean) => {
    const updated = saveSettings({ devMode: enabled });
    setSettingsState(updated);
  }, []);

  const setDarkMode = useCallback((enabled: boolean) => {
    const updated = saveSettings({ darkMode: enabled });
    setSettingsState(updated);
  }, []);

  const setPro = useCallback((enabled: boolean) => {
    const updated = saveSettings({ proStatus: enabled });
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
        todayWater,
        incrementWater,
        decrementWater,
        setDevMode,
        setDarkMode,
        setPro,
        updateUserGoals,
        setWaterGoal,
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
