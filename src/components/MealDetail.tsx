import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Clock, Trash2, Beef, Apple, Candy } from 'lucide-react';
import { Meal, Goals } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useApp } from '@/contexts/AppContext';
import { HealthWarning, HealthPositive, getHealthWarnings } from '@/components/HealthWarning';
import { formatTime } from '@/lib/validation';

interface MealDetailProps {
  meal: Meal | null;
  onClose: () => void;
}

const mealTypeLabels = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

// Get color class based on nutrition health status
function getNutritionColor(type: 'calories' | 'protein' | 'fiber' | 'sugar', value: number, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', allValues?: { calories: number; protein?: number; fiber?: number; sugar?: number }, userGoals?: Goals): string {
  const cal = allValues?.calories || (type === 'calories' ? value : 500);
  const prot = allValues?.protein ?? (type === 'protein' ? value : 20);
  const fib = allValues?.fiber ?? (type === 'fiber' ? value : 5);
  const sug = allValues?.sugar ?? (type === 'sugar' ? value : 10);
  
  const warnings = getHealthWarnings(cal, prot, fib, sug, mealType, userGoals);
  
  // Check specific warnings based on type
  if (type === 'calories') {
    if (warnings.highCalories) return 'bg-destructive/20 border-destructive/30 text-destructive';
    if (warnings.lowCalories) return 'bg-warning/20 border-warning/30 text-warning';
    if (warnings.goodCalories) return 'bg-success/15 border-success/20 text-success';
  }
  if (type === 'protein') {
    if (warnings.highProtein) return 'bg-destructive/20 border-destructive/30 text-destructive';
    if (warnings.lowProtein) return 'bg-warning/20 border-warning/30 text-warning';
    if (warnings.goodProtein) return 'bg-success/15 border-success/20 text-success';
  }
  if (type === 'fiber') {
    if (warnings.highFiber) return 'bg-warning/20 border-warning/30 text-warning';
    if (warnings.lowFiber) return 'bg-warning/20 border-warning/30 text-warning';
    if (warnings.goodFiber) return 'bg-success/15 border-success/20 text-success';
  }
  if (type === 'sugar') {
    if (warnings.highSugar) return 'bg-destructive/20 border-destructive/30 text-destructive';
    if (warnings.goodSugar) return 'bg-success/15 border-success/20 text-success';
  }
  
  // Default neutral
  return 'bg-secondary/50 border-border/50 text-foreground';
}

export function MealDetail({ meal, onClose }: MealDetailProps) {
  const { removeMeal, settings, isPro } = useApp();
  const userGoals = isPro ? settings.goals : undefined;

  const handleDelete = async () => {
    if (meal) {
      await removeMeal(meal.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {meal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-card rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="relative">
              <img
                src={meal.photo}
                alt={mealTypeLabels[meal.mealType]}
                className="w-full aspect-video object-cover"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{mealTypeLabels[meal.mealType]}</h2>
                  <p className="text-muted-foreground text-sm">{meal.date}</p>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span className="text-lg font-medium">{formatTime(meal.time, settings.use24Hour)}</span>
                </div>
              </div>

              {/* Health Warning */}
              <HealthWarning
                calories={meal.calories}
                protein={meal.protein}
                fiber={meal.fiber}
                sugar={meal.sugar}
                mealType={meal.mealType}
                userGoals={userGoals}
              />
              <HealthPositive
                calories={meal.calories}
                protein={meal.protein}
                fiber={meal.fiber}
                sugar={meal.sugar}
                mealType={meal.mealType}
                userGoals={userGoals}
              />

              {/* Nutrition with color coding */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl p-4 border ${getNutritionColor('calories', meal.calories, meal.mealType, { calories: meal.calories, protein: meal.protein, fiber: meal.fiber, sugar: meal.sugar }, userGoals)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-4 h-4" />
                    <span className="font-semibold text-sm">Calories</span>
                  </div>
                  <p className="text-3xl font-bold">{meal.calories}</p>
                </div>
                {meal.protein !== undefined && (
                  <div className={`rounded-xl p-4 border ${getNutritionColor('protein', meal.protein, meal.mealType, { calories: meal.calories, protein: meal.protein, fiber: meal.fiber, sugar: meal.sugar }, userGoals)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Beef className="w-4 h-4" />
                      <span className="font-semibold text-sm">Protein</span>
                    </div>
                    <p className="text-3xl font-bold">{meal.protein}g</p>
                  </div>
                )}
                {meal.fiber !== undefined && (
                  <div className={`rounded-xl p-4 border ${getNutritionColor('fiber', meal.fiber, meal.mealType, { calories: meal.calories, protein: meal.protein, fiber: meal.fiber, sugar: meal.sugar }, userGoals)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Apple className="w-4 h-4" />
                      <span className="font-semibold text-sm">Fiber</span>
                    </div>
                    <p className="text-3xl font-bold">{meal.fiber}g</p>
                  </div>
                )}
                {meal.sugar !== undefined && (
                  <div className={`rounded-xl p-4 border ${getNutritionColor('sugar', meal.sugar, meal.mealType, { calories: meal.calories, protein: meal.protein, fiber: meal.fiber, sugar: meal.sugar }, userGoals)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Candy className="w-4 h-4" />
                      <span className="font-semibold text-sm">Sugar</span>
                    </div>
                    <p className="text-3xl font-bold">{meal.sugar}g</p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {meal.tags && meal.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wider">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {meal.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1.5 bg-secondary/50 rounded-lg text-sm border border-border/50">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full h-14 text-lg rounded-xl"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Delete Meal
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this meal?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove this log from your device.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
