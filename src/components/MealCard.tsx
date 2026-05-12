import { memo } from 'react';
import { motion } from 'framer-motion';
import { Meal } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Flame, Clock, AlertTriangle } from 'lucide-react';
import { getHealthWarnings, hasAnyWarning } from '@/components/HealthWarning';
import { useApp } from '@/contexts/AppContext';
import { formatTime } from '@/lib/validation';

interface MealCardProps {
  meal: Meal;
  onClick?: () => void;
  compact?: boolean;
}

const mealTypeLabels = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const mealTypeColors = {
  breakfast: 'bg-warning/15 text-warning border-warning/20',
  lunch: 'bg-primary/15 text-primary border-primary/20',
  dinner: 'bg-chart-4/15 text-chart-4 border-chart-4/20',
  snack: 'bg-chart-2/15 text-chart-2 border-chart-2/20',
};

const mealTypeDotColors = {
  breakfast: 'bg-warning',
  lunch: 'bg-primary',
  dinner: 'bg-chart-4',
  snack: 'bg-chart-2',
};

function MealCardImpl({ meal, onClick, compact }: MealCardProps) {
  const { settings, animationsEnabled } = useApp();
  const noMotion = !animationsEnabled;
  const warnings = getHealthWarnings(meal.calories, meal.protein, meal.fiber, meal.sugar, meal.mealType, undefined, undefined, { isLogged: true });
  const hasWarnings = hasAnyWarning(warnings);

  if (compact) {
    return (
      <motion.button
        whileTap={noMotion ? {} : { scale: 0.82, rotate: -5 }}
        whileHover={noMotion ? {} : { scale: 1.12, y: -4 }}
        transition={{ type: 'spring', damping: 10, stiffness: 250 }}
        onClick={onClick}
        className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden relative border border-border/50"
      >
        <img src={meal.photo} alt={mealTypeLabels[meal.mealType]} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
          <span className="text-white text-xs font-bold">{meal.calories}</span>
        </div>
        {hasWarnings && (
          <div className="absolute top-1 right-1 w-5 h-5 bg-warning/90 rounded-md flex items-center justify-center">
            <AlertTriangle className="w-3 h-3 text-white" />
          </div>
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={noMotion ? {} : { scale: 0.95 }}
      whileHover={noMotion ? {} : { y: -6, scale: 1.02 }}
      transition={{ type: 'spring', damping: 12, stiffness: 200 }}
      onClick={onClick}
      className={`w-full glass rounded-xl overflow-hidden text-left card-interactive ${animationsEnabled ? 'animate-shine' : ''}`}
    >
      <div className="aspect-video relative">
        <img src={meal.photo} alt={mealTypeLabels[meal.mealType]} className="w-full h-full object-cover" />
        <div className="absolute top-3 left-3">
          <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border border-border/60',
            'bg-background/70 text-foreground backdrop-blur-sm shadow-soft'
          )}>
            <span className={cn('w-2 h-2 rounded-full', mealTypeDotColors[meal.mealType])} />
            {mealTypeLabels[meal.mealType]}
          </span>
        </div>
        {hasWarnings && (
          <motion.div 
            animate={noMotion ? {} : { scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute top-3 right-3 px-2 py-1 bg-warning/90 rounded-lg flex items-center gap-1"
          >
            <AlertTriangle className="w-3 h-3 text-white" />
            <span className="text-white text-[10px] font-bold">!</span>
          </motion.div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold">{meal.calories} cal</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{formatTime(meal.time, settings.use24Hour)}</span>
          </div>
        </div>
        {(meal.protein || meal.fiber || meal.sugar) && (
          <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
            {meal.protein && <span>Protein: {meal.protein}g</span>}
            {meal.fiber && <span>Fiber: {meal.fiber}g</span>}
            {meal.sugar && <span>Sugar: {meal.sugar}g</span>}
          </div>
        )}
        {meal.tags && meal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {meal.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-secondary rounded-lg text-xs border border-border/50">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.button>
  );
}
