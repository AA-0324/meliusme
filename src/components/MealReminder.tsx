import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Utensils, Coffee, Sun, Moon, Cookie } from 'lucide-react';

interface MealReminderProps {
  lastMealTime?: string;
  todayMealTypes: string[];
}

type MealSuggestion = {
  type: string;
  icon: React.ReactNode;
  message: string;
  color: string;
};

export function MealReminder({ lastMealTime, todayMealTypes }: MealReminderProps) {
  const suggestion = useMemo((): MealSuggestion | null => {
    const now = new Date();
    const hour = now.getHours();
    
    // Morning: 6-10
    if (hour >= 6 && hour < 10 && !todayMealTypes.includes('breakfast')) {
      return {
        type: 'breakfast',
        icon: <Coffee className="w-5 h-5" />,
        message: "Good morning! Don't forget your breakfast",
        color: 'from-amber-500 to-orange-500',
      };
    }
    
    // Lunch: 11-14
    if (hour >= 11 && hour < 14 && !todayMealTypes.includes('lunch')) {
      return {
        type: 'lunch',
        icon: <Sun className="w-5 h-5" />,
        message: "It's lunchtime! Log your meal",
        color: 'from-yellow-500 to-amber-500',
      };
    }
    
    // Dinner: 17-21
    if (hour >= 17 && hour < 21 && !todayMealTypes.includes('dinner')) {
      return {
        type: 'dinner',
        icon: <Moon className="w-5 h-5" />,
        message: "Time for dinner! What's cooking?",
        color: 'from-indigo-500 to-purple-500',
      };
    }

    // Snack reminder if no meal in 4+ hours
    if (lastMealTime) {
      const [lastH, lastM] = lastMealTime.split(':').map(Number);
      const lastMealDate = new Date();
      lastMealDate.setHours(lastH, lastM, 0, 0);
      const hoursSince = (now.getTime() - lastMealDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSince >= 4 && hour >= 14 && hour < 17) {
        return {
          type: 'snack',
          icon: <Cookie className="w-5 h-5" />,
          message: "Been a while! Maybe a healthy snack?",
          color: 'from-emerald-500 to-teal-500',
        };
      }
    }
    
    return null;
  }, [lastMealTime, todayMealTypes]);

  if (!suggestion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-r ${suggestion.color} rounded-2xl p-4 text-white shadow-lg`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          {suggestion.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-white/80 text-xs mb-0.5">
            <Clock className="w-3 h-3" />
            <span>Meal Reminder</span>
          </div>
          <p className="font-semibold text-sm">{suggestion.message}</p>
        </div>
        <Utensils className="w-5 h-5 opacity-60" />
      </div>
    </motion.div>
  );
}
