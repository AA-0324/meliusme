import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Goals } from '@/lib/db';
import { BodyProfile } from '@/lib/bodyGoals';

export interface HealthWarnings {
  // Negative warnings
  highCalories?: boolean;
  lowCalories?: boolean;
  highSugar?: boolean;
  lowProtein?: boolean;
  lowFiber?: boolean;
  highProtein?: boolean;
  highFiber?: boolean;
  
  // Positive indicators
  goodCalories?: boolean;
  goodProtein?: boolean;
  goodFiber?: boolean;
  goodSugar?: boolean;
  
  // Context
  messages: string[];
  positiveMessages: string[];
}

interface HealthWarningProps {
  calories: number;
  protein?: number;
  fiber?: number;
  sugar?: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  compact?: boolean;
  userGoals?: Goals;
  isLogged?: boolean;
}

// Meal distribution ratios
const MEAL_RATIOS = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.30,
  snack: 0.10,
};

// Default thresholds when no user goals are set
const DEFAULT_DAILY_TARGETS = {
  calories: 2000,
  protein: 50,
  fiber: 25,
  sugar: 50,
};

// Get thresholds based on meal type, time, user goals, and body profile
function getThresholds(
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  userGoals?: Goals,
  bodyProfile?: BodyProfile | null
) {
  const hour = new Date().getHours();
  const goal = bodyProfile?.goal;
  
  // Use user goals if available, otherwise defaults
  const dailyCalories = userGoals?.calories || DEFAULT_DAILY_TARGETS.calories;
  const dailyProtein = userGoals?.protein || DEFAULT_DAILY_TARGETS.protein;
  const dailyFiber = userGoals?.fiber || DEFAULT_DAILY_TARGETS.fiber;
  const dailySugar = userGoals?.sugar || DEFAULT_DAILY_TARGETS.sugar;
  
  const ratio = MEAL_RATIOS[mealType];
  
  // Calculate base thresholds from daily targets
  let thresholds = {
    // Calories: allow 50% below to 120% above target for the meal
    minCalories: Math.round(dailyCalories * ratio * 0.5),
    maxCalories: Math.round(dailyCalories * ratio * 1.2),
    // Protein: minimum 70% of meal target, max 200% (hard to overdo)
    minProtein: Math.round(dailyProtein * ratio * 0.7),
    maxProtein: Math.round(dailyProtein * ratio * 2.5),
    // Fiber: minimum 50% of meal target
    minFiber: Math.round(dailyFiber * ratio * 0.5),
    maxFiber: Math.round(dailyFiber * ratio * 3), // Very hard to overdo fiber
    // Sugar: max 120% of meal target
    maxSugar: Math.round(dailySugar * ratio * 1.2),
  };
  
  // Adjust based on goal (bulking/cutting/maintain)
  if (goal === 'bulking') {
    // Bulking: higher calorie tolerance, higher protein expectations
    thresholds.maxCalories = Math.round(thresholds.maxCalories * 1.3);
    thresholds.minCalories = Math.round(thresholds.minCalories * 0.8);
    thresholds.minProtein = Math.round(thresholds.minProtein * 1.2);
    thresholds.maxProtein = Math.round(thresholds.maxProtein * 1.5);
    // More lenient on sugar when bulking
    thresholds.maxSugar = Math.round(thresholds.maxSugar * 1.2);
  } else if (goal === 'cutting') {
    // Cutting: stricter calorie limits, higher protein requirement
    thresholds.maxCalories = Math.round(thresholds.maxCalories * 0.85);
    thresholds.minProtein = Math.round(thresholds.minProtein * 1.3);
    thresholds.minFiber = Math.round(thresholds.minFiber * 1.2);
    // Stricter on sugar when cutting
    thresholds.maxSugar = Math.round(thresholds.maxSugar * 0.8);
  }
  
  // Adjust based on time of day
  if (mealType === 'dinner' && hour >= 21) {
    // Late dinner should be lighter
    thresholds.maxCalories = Math.round(thresholds.maxCalories * 0.7);
    thresholds.minCalories = Math.round(thresholds.minCalories * 0.5);
  }
  if (mealType === 'breakfast' && hour >= 10) {
    // Late breakfast (brunch) can be heavier
    thresholds.maxCalories = Math.round(thresholds.maxCalories * 1.15);
  }
  
  // Snacks have different minimums - they're optional extras
  if (mealType === 'snack') {
    thresholds.minCalories = 20; // Very low minimum for snacks
    thresholds.minProtein = 0;
    thresholds.minFiber = 0;
  }
  
  // Ensure minimums don't go below sensible values
  thresholds.minCalories = Math.max(thresholds.minCalories, mealType === 'snack' ? 20 : 150);
  thresholds.minProtein = Math.max(thresholds.minProtein, mealType === 'snack' ? 0 : 5);
  thresholds.minFiber = Math.max(thresholds.minFiber, 0);
  
  return { thresholds, goal };
}

export function getHealthWarnings(
  calories: number,
  protein: number | undefined,
  fiber: number | undefined,
  sugar: number | undefined,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  userGoals?: Goals,
  bodyProfile?: BodyProfile | null,
  options?: { isLogged?: boolean }
): HealthWarnings {
  const isLogged = options?.isLogged ?? false;
  const { thresholds, goal } = getThresholds(mealType, userGoals, bodyProfile);
  const warnings: HealthWarnings = {
    messages: [],
    positiveMessages: [],
  };
  
  const goalLabel = goal === 'bulking' ? 'bulking' : goal === 'cutting' ? 'cutting' : '';
  
  // === CALORIE CHECKS ===
  if (calories > 0) {
    if (calories > thresholds.maxCalories) {
      warnings.highCalories = true;
      if (goal === 'cutting') {
        warnings.messages.push(`High calories for ${mealType} while cutting (${calories} > ${thresholds.maxCalories})`);
      } else if (goal === 'bulking') {
        // Only warn if WAY over for bulking
        if (calories > thresholds.maxCalories * 1.3) {
          warnings.messages.push(`Very high calories even for bulking (${calories} cal)`);
        } else {
          // It's fine for bulking, actually good
          warnings.goodCalories = true;
          warnings.positiveMessages.push('Good calorie intake for bulking');
        }
      } else {
        warnings.messages.push(`High calories for ${mealType} (${calories} > ${thresholds.maxCalories})`);
      }
    } else if (calories < thresholds.minCalories && mealType !== 'snack') {
      warnings.lowCalories = true;
      if (goal === 'bulking') {
        warnings.messages.push(`Low calories for ${mealType} while bulking (${calories} < ${thresholds.minCalories})`);
      } else if (goal === 'cutting') {
        // Low calories might be intentional when cutting, only warn if very low
        if (calories < thresholds.minCalories * 0.5) {
          warnings.messages.push(`Very low calories - may affect metabolism (${calories} cal)`);
        } else {
          warnings.goodCalories = true;
          warnings.positiveMessages.push('Good calorie control for cutting');
        }
      } else {
        warnings.messages.push(`Low calories for ${mealType} (${calories} < ${thresholds.minCalories})`);
      }
    } else {
      warnings.goodCalories = true;
      if (goalLabel) {
        warnings.positiveMessages.push(`Good calories for ${goalLabel}`);
      }
    }
  }
  
  // === PROTEIN CHECKS ===
  if (protein !== undefined && calories > 100) {
    if (protein < thresholds.minProtein && mealType !== 'snack') {
      warnings.lowProtein = true;
      if (goal === 'bulking' || goal === 'cutting') {
        warnings.messages.push(`Low protein for ${goalLabel} (${protein}g < ${thresholds.minProtein}g)`);
      } else {
        warnings.messages.push(`Low protein for ${mealType} (${protein}g)`);
      }
    } else if (protein > thresholds.maxProtein && !isLogged) {
      // Very high protein - unusual but warn (only during logging, not when viewing)
      warnings.highProtein = true;
      warnings.messages.push(`Unusually high protein (${protein}g) - verify entry`);
    } else if (protein >= thresholds.minProtein) {
      warnings.goodProtein = true;
      if (goal === 'bulking' && protein >= thresholds.minProtein * 1.3) {
        warnings.positiveMessages.push('Excellent protein for muscle building');
      } else if (goal === 'cutting' && protein >= thresholds.minProtein * 1.2) {
        warnings.positiveMessages.push('Great protein to preserve muscle');
      }
    }
  }
  
  // === FIBER CHECKS ===
  if (fiber !== undefined && calories > 100) {
    if (fiber < thresholds.minFiber && mealType !== 'snack') {
      warnings.lowFiber = true;
      warnings.messages.push(`Low fiber for ${mealType} (${fiber}g)`);
    } else if (fiber > thresholds.maxFiber && !isLogged) {
      warnings.highFiber = true;
      warnings.messages.push(`Very high fiber (${fiber}g) - may cause discomfort`);
    } else if (fiber >= thresholds.minFiber) {
      warnings.goodFiber = true;
    }
  }
  
  // === SUGAR CHECKS ===
  if (sugar !== undefined) {
    if (sugar > thresholds.maxSugar && !isLogged) {
      warnings.highSugar = true;
      if (goal === 'cutting') {
        warnings.messages.push(`High sugar while cutting (${sugar}g > ${thresholds.maxSugar}g)`);
      } else {
        warnings.messages.push(`High sugar content (${sugar}g)`);
      }
    } else {
      warnings.goodSugar = true;
    }
  }
  
  // === MACRO BALANCE CHECK ===
  // If bulking with high calories AND high protein AND decent fiber - this is GOOD
  if (goal === 'bulking' && calories > 0 && protein !== undefined && fiber !== undefined) {
    const hasGoodProtein = protein >= thresholds.minProtein;
    const hasAcceptableCalories = calories <= thresholds.maxCalories * 1.3;
    const hasAcceptableSugar = sugar === undefined || sugar <= thresholds.maxSugar * 1.2;
    
    if (hasGoodProtein && hasAcceptableCalories && hasAcceptableSugar) {
      // Clear any calorie warnings for bulking if macros are balanced
      if (warnings.highCalories && calories <= thresholds.maxCalories * 1.3) {
        warnings.highCalories = false;
        warnings.goodCalories = true;
        warnings.messages = warnings.messages.filter(m => !m.includes('High calories'));
        if (!warnings.positiveMessages.some(m => m.includes('bulking'))) {
          warnings.positiveMessages.push('Well-balanced meal for bulking');
        }
      }
    }
  }
  
  // === CUTTING BALANCE CHECK ===
  if (goal === 'cutting' && calories > 0 && protein !== undefined) {
    const hasGoodProtein = protein >= thresholds.minProtein;
    const hasLowCalories = calories <= thresholds.maxCalories;
    const hasLowSugar = sugar === undefined || sugar <= thresholds.maxSugar;
    
    if (hasGoodProtein && hasLowCalories && hasLowSugar) {
      if (!warnings.positiveMessages.some(m => m.includes('cutting'))) {
        warnings.positiveMessages.push('Great macro balance for cutting');
      }
    }
  }
  
  return warnings;
}

export function hasAnyWarning(warnings: HealthWarnings): boolean {
  return !!(
    warnings.highCalories || 
    warnings.lowCalories || 
    warnings.highSugar || 
    warnings.lowProtein || 
    warnings.lowFiber ||
    warnings.highProtein ||
    warnings.highFiber
  );
}

export function hasAnyPositive(warnings: HealthWarnings): boolean {
  return warnings.positiveMessages.length > 0;
}

export function HealthWarning({ calories, protein, fiber, sugar, mealType, compact, userGoals, isLogged }: HealthWarningProps) {
  const warnings = getHealthWarnings(calories, protein, fiber, sugar, mealType, userGoals, undefined, { isLogged });
  const hasWarnings = hasAnyWarning(warnings);
  const hasPositives = hasAnyPositive(warnings);
  
  // Don't show anything if no warnings
  if (!hasWarnings) return null;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1 px-2 py-1 bg-warning/20 rounded-lg"
      >
        <AlertTriangle className="w-3 h-3 text-warning" />
        <span className="text-[10px] font-semibold text-warning">{warnings.messages.length}</span>
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
            {warnings.messages.map((msg) => (
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

// Component to show positive feedback
export function HealthPositive({ calories, protein, fiber, sugar, mealType, userGoals, isLogged }: Omit<HealthWarningProps, 'compact'>) {
  const warnings = getHealthWarnings(calories, protein, fiber, sugar, mealType, userGoals, undefined, { isLogged });
  const hasWarnings = hasAnyWarning(warnings);
  const hasPositives = hasAnyPositive(warnings);
  
  // Only show positive if no warnings and has positive messages
  if (hasWarnings || !hasPositives) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 p-3 bg-success/10 border border-success/20 rounded-xl"
    >
      <div className="flex items-start gap-2">
        <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-success mb-1">Looking Good!</p>
          <div className="flex flex-wrap gap-1.5">
            {warnings.positiveMessages.map((msg) => (
              <span
                key={msg}
                className="px-2 py-0.5 bg-success/20 text-success text-[10px] font-medium rounded-full"
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
