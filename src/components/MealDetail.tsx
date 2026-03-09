import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Clock, Trash2, Beef, Apple, Candy, BookmarkPlus } from 'lucide-react';
import { Meal, Goals } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useApp } from '@/contexts/AppContext';
import { HealthWarning, HealthPositive, getHealthWarnings } from '@/components/HealthWarning';
import { formatTime } from '@/lib/validation';
import { ProBadge } from '@/components/ProBadge';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { saveMealTemplate } from '@/lib/proFeatures';
import { toast } from 'sonner';

interface MealDetailProps {
  meal: Meal | null;
  onClose: () => void;
}

const mealTypeLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

function getNutritionColor(type: 'calories' | 'protein' | 'fiber' | 'sugar', value: number, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', allValues?: { calories: number; protein?: number; fiber?: number; sugar?: number }, userGoals?: Goals): string {
  const cal = allValues?.calories || (type === 'calories' ? value : 500);
  const prot = allValues?.protein ?? (type === 'protein' ? value : 20);
  const fib = allValues?.fiber ?? (type === 'fiber' ? value : 5);
  const sug = allValues?.sugar ?? (type === 'sugar' ? value : 10);
  const warnings = getHealthWarnings(cal, prot, fib, sug, mealType, userGoals, undefined, { isLogged: true });
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
  return 'bg-secondary/50 border-border/50 text-foreground';
}

export function MealDetail({ meal, onClose }: MealDetailProps) {
  const { removeMeal, settings, isPro } = useApp();
  const userGoals = settings.goals;
  const [showProModal, setShowProModal] = useState(false);
  const [editHistory, setEditHistory] = useState<MealEdit[]>([]);

  useEffect(() => {
    if (meal && isPro) {
      getMealEditHistory(meal.id).then(setEditHistory);
    }
  }, [meal, isPro]);

  const handleDelete = async () => {
    if (meal) { await removeMeal(meal.id); onClose(); }
  };

  const handleSaveAsTemplate = async () => {
    if (!meal) return;
    if (!isPro) {
      setShowProModal(true);
      return;
    }
    await saveMealTemplate({
      name: `${mealTypeLabels[meal.mealType]} - ${meal.date}`,
      mealType: meal.mealType,
      calories: meal.calories,
      protein: meal.protein,
      fiber: meal.fiber,
      sugar: meal.sugar,
      tags: meal.tags,
    });
    toast.success('Saved as template');
  };

  return (
    <>
    <AnimatePresence>
      {meal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background flex flex-col"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full bg-card flex flex-col overflow-hidden"
          >
            {/* Header image */}
            <div className="relative flex-shrink-0">
              <img src={meal.photo} alt={mealTypeLabels[meal.mealType]} className="w-full aspect-video object-cover" />
              <button onClick={onClose} 
                className="absolute top-4 right-4 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center pt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
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

              <HealthWarning calories={meal.calories} protein={meal.protein} fiber={meal.fiber} sugar={meal.sugar} mealType={meal.mealType} userGoals={userGoals} isLogged />
              <HealthPositive calories={meal.calories} protein={meal.protein} fiber={meal.fiber} sugar={meal.sugar} mealType={meal.mealType} userGoals={userGoals} isLogged />

              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'calories' as const, icon: Flame, label: 'Calories', value: meal.calories, unit: '' },
                  { type: 'protein' as const, icon: Beef, label: 'Protein', value: meal.protein, unit: 'g' },
                  { type: 'fiber' as const, icon: Apple, label: 'Fiber', value: meal.fiber, unit: 'g' },
                  { type: 'sugar' as const, icon: Candy, label: 'Sugar', value: meal.sugar, unit: 'g' },
                ].filter(item => item.value !== undefined).map((item) => (
                  <motion.div key={item.type}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className={`rounded-xl p-4 border ${getNutritionColor(item.type, item.value!, meal.mealType, { calories: meal.calories, protein: meal.protein, fiber: meal.fiber, sugar: meal.sugar }, userGoals)}`}>
                    <div className="flex items-center gap-2 mb-1"><item.icon className="w-4 h-4" /><span className="font-semibold text-sm">{item.label}</span></div>
                    <p className="text-3xl font-bold">{item.value}{item.unit}</p>
                  </motion.div>
                ))}
              </div>

              {meal.tags && meal.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wider">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {meal.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1.5 bg-secondary/50 rounded-lg text-sm border border-border/50">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Save as Template */}
              <Button
                variant="outline"
                onClick={handleSaveAsTemplate}
                className="w-full h-12 rounded-xl justify-center gap-2 font-semibold"
              >
                <BookmarkPlus className="w-5 h-5" />
                Save as Template
                {!isPro && <ProBadge className="ml-1" />}
              </Button>

              {/* Edit History (Pro) */}
              <div className="bg-secondary/20 rounded-2xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Edit History</h3>
                  {!isPro && <ProBadge />}
                </div>
                {isPro ? (
                  editHistory.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {editHistory.map((edit) => (
                        <div key={edit.id} className="bg-card rounded-lg p-3 border border-border/50">
                          <div className="text-xs text-muted-foreground mb-1">
                            {format(new Date(edit.timestamp), 'MMM d, yyyy HH:mm')}
                          </div>
                          {edit.changes.map((change, i) => (
                            <div key={i} className="text-sm">
                              <span className="font-medium capitalize">{change.field}</span>:
                              <span className="text-muted-foreground"> {String(change.oldValue)}</span>
                              <span className="text-primary mx-1">&rarr;</span>
                              <span>{String(change.newValue)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No edits recorded</p>
                  )
                ) : (
                  <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm">Unlock with Pro</span>
                  </div>
                )}
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full h-14 text-lg rounded-xl">
                    <Trash2 className="w-5 h-5 mr-2" />Delete Meal
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-border bg-card">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this meal?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently remove this log from your device.</AlertDialogDescription>
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
    <ProUpgradeModal open={showProModal} onClose={() => setShowProModal(false)} />
    </>
  );
}