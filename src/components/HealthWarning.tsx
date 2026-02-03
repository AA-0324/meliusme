import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Goals } from '@/lib/db';

export interface HealthWarnings {
  highCalories?: boolean;
  lowCalories?: boolean;
  highSugar?: boolean;
  lowProtein?: boolean;
  lowFiber?: boolean;
  goodCalories?: boolean;
  goodProtein?: boolean;
  goodFiber?: boolean;
  goodSugar?: boolean;
}

interface HealthWarningProps {
  calories: number;
  protein?: number;
  fiber?: number;
  sugar?: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  compact?: boolean;
  userGoals?: Goals;
}

// Dynamic thresholds based on meal type and time
function getThresholds(mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', userGoals?: Goals) {
  const hour = new Date().getHours();
  
  // Base thresholds
  const baseThresholds = {
    breakfast: { minCalories: 250, maxCalories: 600, maxSugar: 20, minProtein: 10, minFiber: 3 },
    lunch: { minCalories: 350, maxCalories: 800, maxSugar: 25, minProtein: 20, minFiber: 5 },
    dinner: { minCalories: 450, maxCalories: 900, maxSugar: 20, minProtein: 25, minFiber: 6 },
    snack: { minCalories: 50, maxCalories: 300, maxSugar: 15, minProtein: 5, minFiber: 2 },
  };

  let thresholds = { ...baseThresholds[mealType] };

  // Adjust based on time of day
  if (mealType === 'dinner' && hour >= 21) {
    // Late dinner should be lighter
    thresholds.maxCalories = Math.round(thresholds.maxCalories * 0.7);
    thresholds.minCalories = Math.round(thresholds.minCalories * 0.7);
  }
  if (mealType === 'breakfast' && hour >= 10) {
    // Late breakfast (brunch) can be heavier
    thresholds.maxCalories = Math.round(thresholds.maxCalories * 1.2);
  }

  // Adjust based on user goals if Pro
  if (userGoals) {
    const dailyCalories = userGoals.calories;
    const mealRatios = {
      breakfast: 0.25,
      lunch: 0.35,
      dinner: 0.30,
      snack: 0.10,
    };
    thresholds.maxCalories = Math.round(dailyCalories * mealRatios[mealType] * 1.2);
    thresholds.minCalories = Math.round(dailyCalories * mealRatios[mealType] * 0.5);
    
    if (userGoals.protein) {
      thresholds.minProtein = Math.round((userGoals.protein * mealRatios[mealType]) * 0.7);
    }
    if (userGoals.fiber) {
      thresholds.minFiber = Math.round((userGoals.fiber * mealRatios[mealType]) * 0.7);
    }
    if (userGoals.sugar) {
      thresholds.maxSugar = Math.round((userGoals.sugar * mealRatios[mealType]) * 1.2);
    }
  }

  return thresholds;
}

export function getHealthWarnings(
  calories: number,
  protein: number | undefined,
  fiber: number | undefined,
  sugar: number | undefined,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  userGoals?: Goals
): HealthWarnings {
  const thresholds = getThresholds(mealType, userGoals);
  const warnings: HealthWarnings = {};

  // Check calories
  if (calories > thresholds.maxCalories) {
    warnings.highCalories = true;
  } else if (calories > 0 && calories < thresholds.minCalories && mealType !== 'snack') {
    warnings.lowCalories = true;
  } else if (calories > 0 && calories <= thresholds.maxCalories) {
    warnings.goodCalories = true;
  }

  // Check sugar
  if (sugar !== undefined) {
    if (sugar > thresholds.maxSugar) {
      warnings.highSugar = true;
    } else if (sugar <= thresholds.maxSugar) {
      warnings.goodSugar = true;
    }
  }

  // Check protein (only if calories are significant)
  if (protein !== undefined && calories > 200) {
    if (protein < thresholds.minProtein) {
      warnings.lowProtein = true;
    } else {
      warnings.goodProtein = true;
    }
  }

  // Check fiber (only if calories are significant)
  if (fiber !== undefined && calories > 200) {
    if (fiber < thresholds.minFiber) {
      warnings.lowFiber = true;
    } else {
      warnings.goodFiber = true;
    }
  }

  return warnings;
}

export function hasAnyWarning(warnings: HealthWarnings): boolean {
  return warnings.highCalories || warnings.highSugar || warnings.lowProtein || warnings.lowFiber || false;
}

export function HealthWarning({ calories, protein, fiber, sugar, mealType, compact, userGoals }: HealthWarningProps) {
  const warnings = getHealthWarnings(calories, protein, fiber, sugar, mealType, userGoals);
  const hasWarnings = hasAnyWarning(warnings);
  
  if (!hasWarnings) return null;

  const warningMessages: string[] = [];
  if (warnings.highCalories) warningMessages.push(userGoals ? 'High calories vs your goal for this meal' : 'High calories for this meal');
  if (warnings.lowCalories) warningMessages.push('Very low calories for this meal');
  if (warnings.highSugar) warningMessages.push('High sugar content');
  if (warnings.lowProtein) warningMessages.push('Low protein');
  if (warnings.lowFiber) warningMessages.push('Low fiber');

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1 px-2 py-1 bg-warning/20 rounded-lg"
      >
        <AlertTriangle className="w-3 h-3 text-warning" />
        <span className="text-[10px] font-semibold text-warning">{warningMessages.length}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 p-3 bg-warning/10 border border-warning/20 rounded-xl"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-warning mb-1">Health Notice</p>
          <div className="flex flex-wrap gap-1.5">
            {warningMessages.map((msg) => (
              <span
                key={msg}
                className="px-2 py-0.5 bg-warning/20 text-warning text-[10px] font-medium rounded-full"
              >
                {msg}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
