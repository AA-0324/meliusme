import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Clock, Trash2 } from 'lucide-react';
import { Meal } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

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

export function MealDetail({ meal, onClose }: MealDetailProps) {
  const { removeMeal } = useApp();

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
          className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center"
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
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{mealTypeLabels[meal.mealType]}</h2>
                  <p className="text-muted-foreground">{meal.date}</p>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span className="text-lg">{meal.time}</span>
                </div>
              </div>

              {/* Nutrition */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <Flame className="w-5 h-5" />
                    <span className="font-medium">Calories</span>
                  </div>
                  <p className="text-3xl font-bold">{meal.calories}</p>
                </div>
                {meal.protein !== undefined && (
                  <div className="bg-secondary rounded-2xl p-4">
                    <span className="font-medium text-muted-foreground">Protein</span>
                    <p className="text-3xl font-bold">{meal.protein}g</p>
                  </div>
                )}
                {meal.fiber !== undefined && (
                  <div className="bg-secondary rounded-2xl p-4">
                    <span className="font-medium text-muted-foreground">Fiber</span>
                    <p className="text-3xl font-bold">{meal.fiber}g</p>
                  </div>
                )}
                {meal.sugar !== undefined && (
                  <div className="bg-secondary rounded-2xl p-4">
                    <span className="font-medium text-muted-foreground">Sugar</span>
                    <p className="text-3xl font-bold">{meal.sugar}g</p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {meal.tags && meal.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {meal.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1.5 bg-secondary rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete button */}
              <Button
                variant="destructive"
                className="w-full h-14 text-lg rounded-xl"
                onClick={handleDelete}
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete Meal
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
