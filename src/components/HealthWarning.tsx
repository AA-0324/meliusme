import { motion } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';

export interface HealthWarnings {
  highCalories?: boolean;
  highSugar?: boolean;
  lowProtein?: boolean;
  lowFiber?: boolean;
}

interface HealthWarningProps {
  calories: number;
  protein?: number;
  fiber?: number;
  sugar?: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  compact?: boolean;
}

// Thresholds for health warnings
const THRESHOLDS = {
  breakfast: { maxCalories: 600, maxSugar: 20, minProtein: 10, minFiber: 3 },
  lunch: { maxCalories: 800, maxSugar: 25, minProtein: 20, minFiber: 5 },
  dinner: { maxCalories: 900, maxSugar: 20, minProtein: 25, minFiber: 6 },
  snack: { maxCalories: 300, maxSugar: 15, minProtein: 5, minFiber: 2 },
};

export function getHealthWarnings(
  calories: number,
  protein: number | undefined,
  fiber: number | undefined,
  sugar: number | undefined,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): HealthWarnings {
  const thresholds = THRESHOLDS[mealType];
  const warnings: HealthWarnings = {};

  if (calories > thresholds.maxCalories) {
    warnings.highCalories = true;
  }
  if (sugar !== undefined && sugar > thresholds.maxSugar) {
    warnings.highSugar = true;
  }
  if (protein !== undefined && protein < thresholds.minProtein && calories > 200) {
    warnings.lowProtein = true;
  }
  if (fiber !== undefined && fiber < thresholds.minFiber && calories > 200) {
    warnings.lowFiber = true;
  }

  return warnings;
}

export function hasAnyWarning(warnings: HealthWarnings): boolean {
  return Object.values(warnings).some(Boolean);
}

export function HealthWarning({ calories, protein, fiber, sugar, mealType, compact }: HealthWarningProps) {
  const warnings = getHealthWarnings(calories, protein, fiber, sugar, mealType);
  
  if (!hasAnyWarning(warnings)) return null;

  const warningMessages: string[] = [];
  if (warnings.highCalories) warningMessages.push('High calories');
  if (warnings.highSugar) warningMessages.push('High sugar');
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
