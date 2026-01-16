import { motion } from 'framer-motion';
import { Meal } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Flame, Clock } from 'lucide-react';

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
  breakfast: 'bg-warning/10 text-warning',
  lunch: 'bg-primary/10 text-primary',
  dinner: 'bg-chart-4/10 text-chart-4',
  snack: 'bg-chart-2/10 text-chart-2',
};

export function MealCard({ meal, onClick, compact }: MealCardProps) {
  if (compact) {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden relative"
      >
        <img
          src={meal.photo}
          alt={mealTypeLabels[meal.mealType]}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
          <span className="text-white text-xs font-semibold">{meal.calories}</span>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full bg-card rounded-2xl overflow-hidden shadow-sm border border-border text-left"
    >
      <div className="aspect-video relative">
        <img
          src={meal.photo}
          alt={mealTypeLabels[meal.mealType]}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <span className={cn(
            'px-2.5 py-1 rounded-full text-xs font-semibold',
            mealTypeColors[meal.mealType]
          )}>
            {mealTypeLabels[meal.mealType]}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold">{meal.calories} cal</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{meal.time}</span>
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
              <span key={tag} className="px-2 py-0.5 bg-secondary rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.button>
  );
}
