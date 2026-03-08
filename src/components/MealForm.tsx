import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag, ChevronLeft, Flame, Beef, Apple, Candy, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { ProBadge } from '@/components/ProBadge';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { HealthWarning, HealthPositive } from '@/components/HealthWarning';
import { validateNutrition, validateTag } from '@/lib/validation';
import { toast } from 'sonner';

interface MealFormProps {
  open: boolean;
  photo: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const mealTypes: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

function getSuggestedMealTypeForHour(hour: number): MealType {
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 22) return 'dinner';
  return 'snack';
}

function getAvailableMealTypesForHour(hour: number): MealType[] {
  if (hour >= 5 && hour < 11) return ['breakfast', 'snack'];
  if (hour >= 11 && hour < 16) return ['lunch', 'snack'];
  if (hour >= 16 && hour < 22) return ['dinner', 'snack'];
  return ['snack'];
}

const nutritionFields = [
  { key: 'calories', label: 'Calories', icon: Flame, color: 'from-orange-500/20 to-red-500/20 border-orange-500/30', iconColor: 'text-orange-400', max: 5000, full: true },
  { key: 'protein', label: 'Protein', unit: 'g', icon: Beef, color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30', iconColor: 'text-blue-400', max: 200 },
  { key: 'fiber', label: 'Fiber', unit: 'g', icon: Apple, color: 'from-green-500/20 to-emerald-500/20 border-green-500/30', iconColor: 'text-green-400', max: 100 },
  { key: 'sugar', label: 'Sugar', unit: 'g', icon: Candy, color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30', iconColor: 'text-pink-400', max: 300 },
] as const;

export function MealForm({ open, photo, onClose, onSuccess }: MealFormProps) {
  const { logMeal, isPro, settings, meals } = useApp();
  const [showProModal, setShowProModal] = useState(false);

  const now = new Date();
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [mealType, setMealType] = useState<MealType>(getSuggestedMealTypeForHour(now.getHours()));
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const values: Record<string, string> = { calories, protein, fiber, sugar };
  const setters: Record<string, (v: string) => void> = { calories: setCalories, protein: setProtein, fiber: setFiber, sugar: setSugar };

  const currentHour = now.getHours();
  const availableMealTypes = useMemo(() => getAvailableMealTypesForHour(currentHour), [currentHour]);

  useEffect(() => {
    if (open) {
      const now = new Date();
      const suggested = getSuggestedMealTypeForHour(now.getHours());
      setMealType(suggested);
    }
  }, [open]);

  const todayMealTypes = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return meals.filter(m => m.date === today).map(m => m.mealType);
  }, [meals]);

  useEffect(() => {
    if (open) {
      const suggested = getSuggestedMealTypeForHour(currentHour);
      if (todayMealTypes.includes(suggested) && suggested !== 'snack') {
        setMealType('snack');
      } else {
        setMealType(suggested);
      }
    }
  }, [open, todayMealTypes]);

  useEffect(() => {
    if (!open) return;
    if (!availableMealTypes.includes(mealType)) {
      setMealType(getSuggestedMealTypeForHour(currentHour));
    }
  }, [open, availableMealTypes, mealType, currentHour]);

  const showWarnings = useMemo(() => calories && parseInt(calories, 10) > 0, [calories]);

  const sanityValidation = useMemo(() => {
    const cal = parseInt(calories, 10);
    const prot = parseInt(protein, 10);
    const fib = parseInt(fiber, 10);
    const sug = parseInt(sugar, 10);
    if (!Number.isFinite(cal) || !Number.isFinite(prot) || !Number.isFinite(fib) || !Number.isFinite(sug)) return null;
    if (calories === '' || protein === '' || fiber === '' || sugar === '') return null;
    return validateNutrition(cal, prot, fib, sug, mealType);
  }, [calories, protein, fiber, sugar, mealType]);

  const userGoals = settings.goals;

  const handleAddTag = () => {
    const validation = validateTag(tagInput);
    if (!validation.valid) { toast.error(validation.error); return; }
    if (!tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); setTagInput(''); }
  };

  const handleRemoveTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSubmit = async () => {
    if (!photo || isSubmitting) return;
    if (!calories || !protein || !fiber || !sugar) { toast.error('Please fill out calories, protein, fiber, and sugar.'); return; }
    const cal = parseInt(calories, 10);
    const prot = parseInt(protein, 10);
    const fib = parseInt(fiber, 10);
    const sug = parseInt(sugar, 10);
    const validation = validateNutrition(cal, prot, fib, sug, mealType);
    if (!validation.valid) { toast.error(validation.errors[0]); return; }
    setIsSubmitting(true);
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);
    try {
      await logMeal({ photo, calories: cal, protein: prot, fiber: fib, sugar: sug, mealType, date, time, tags: tags.length > 0 ? tags : undefined });
      onSuccess();
      setCalories(''); setProtein(''); setFiber(''); setSugar(''); setTags([]);
    } catch (error) {
      console.error('Failed to log meal:', error);
      toast.error('Failed to save meal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filledCount = [calories, protein, fiber, sugar].filter(v => v !== '').length;
  const progress = (filledCount / 4) * 100;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ type: 'spring', damping: 22, stiffness: 260 }} className="fixed inset-0 z-[100] bg-background flex flex-col" style={{ overscrollBehavior: 'none' }}>
            {/* Hero photo header */}
            <div className="relative flex-shrink-0">
              <div className="relative h-44 bg-black overflow-hidden">
                {photo && (
                  <motion.img 
                    src={photo} 
                    alt="Meal" 
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.7 }}
                    transition={{ duration: 0.6 }}
                    className="w-full h-full object-cover" 
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-background" />
                
                {/* Decorative floating particles */}
                <motion.div 
                  animate={{ y: [-5, 5, -5], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute top-8 right-12 w-2 h-2 rounded-full bg-primary/60"
                />
                <motion.div 
                  animate={{ y: [5, -5, 5], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                  className="absolute top-16 right-24 w-1.5 h-1.5 rounded-full bg-primary/40"
                />
              </div>

              {/* Navigation bar overlaid */}
              <div className="absolute top-0 left-0 right-0 safe-top flex items-center justify-between px-4 pt-3">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </motion.button>
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <UtensilsCrossed className="w-4 h-4 text-primary" />
                  <h1 className="text-white font-bold text-base">Log Meal</h1>
                </motion.div>
                <div className="w-9" />
              </div>

              {/* Progress indicator bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/20">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-r-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: 'spring', damping: 20 }}
                />
              </div>
            </div>

            {/* Scrollable form content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 pt-5 pb-4 space-y-5" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
              {/* Meal Type selector */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: 'spring', damping: 18, stiffness: 200 }}>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 block">
                  What are you having?
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {mealTypes.map(({ value, label }, i) => {
                    const isAvailable = availableMealTypes.includes(value);
                    const isSelected = mealType === value;
                    return (
                      <motion.button
                        key={value}
                        initial={{ opacity: 0, y: 16, scale: 0.85 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.15 + i * 0.06, type: 'spring', damping: 14, stiffness: 220 }}
                        whileTap={isAvailable ? { scale: 0.88 } : {}}
                        whileHover={isAvailable ? { y: -3, scale: 1.04 } : {}}
                        onClick={() => isAvailable && setMealType(value)}
                        disabled={!isAvailable}
                        className={`py-3.5 rounded-xl font-semibold text-xs transition-all flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02]'
                            : isAvailable
                              ? 'bg-secondary/80 text-secondary-foreground hover:bg-secondary'
                              : 'bg-muted/20 text-muted-foreground/40 cursor-not-allowed'
                        }`}
                      >
                        {label}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Nutrition Cards */}
              <motion.div 
                initial={{ opacity: 0, y: 24 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2, type: 'spring', damping: 18, stiffness: 180 }}
                className="space-y-3"
              >
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Nutrition Info
                </Label>

                {/* Calories - full width hero card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.25, type: 'spring', damping: 16, stiffness: 200 }}
                  whileHover={{ scale: 1.01 }}
                  className={`relative rounded-2xl p-4 border bg-gradient-to-br ${nutritionFields[0].color} overflow-hidden`}
                >
                  <motion.div 
                    className="absolute top-2 right-2 opacity-10"
                    animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Flame className="w-16 h-16" />
                  </motion.div>
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div 
                      className={`w-8 h-8 rounded-lg bg-background/30 flex items-center justify-center ${nutritionFields[0].iconColor}`}
                      whileTap={{ scale: 0.9 }}
                      animate={{ scale: calories ? [1, 1.1, 1] : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Flame className="w-4 h-4" />
                    </motion.div>
                    <span className="font-bold text-sm">Calories</span>
                  </div>
                  <Input 
                    type="number" inputMode="numeric" min="0" max="5000" 
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="0"
                    className="h-14 text-3xl rounded-xl bg-background/40 border-0 font-extrabold placeholder:text-muted-foreground/20 text-center focus:ring-2 focus:ring-primary/40 focus:bg-background/60 transition-all duration-200"
                  />
                </motion.div>

                {/* Macros grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  {nutritionFields.slice(1).map((field, i) => {
                    const Icon = field.icon;
                    const hasValue = !!values[field.key];
                    return (
                      <motion.div
                        key={field.key}
                        initial={{ opacity: 0, y: 20, scale: 0.85 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.08, type: 'spring', damping: 14, stiffness: 200 }}
                        whileHover={{ scale: 1.03, y: -2 }}
                        className={`relative rounded-xl p-3 border bg-gradient-to-br ${field.color} overflow-hidden`}
                      >
                        <motion.div 
                          className="absolute -bottom-1 -right-1 opacity-[0.07]"
                          animate={{ rotate: hasValue ? [0, 10, -5, 0] : 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Icon className="w-10 h-10" />
                        </motion.div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <motion.div
                            animate={hasValue ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            <Icon className={`w-3.5 h-3.5 ${field.iconColor}`} />
                          </motion.div>
                          <span className="font-bold text-[10px] uppercase tracking-wider">{field.label}</span>
                        </div>
                        <Input 
                          type="number" inputMode="numeric" min="0" max={field.max}
                          value={values[field.key]}
                          onChange={(e) => setters[field.key](e.target.value)}
                          placeholder="0"
                          className="h-11 text-xl rounded-lg bg-background/40 border-0 font-extrabold placeholder:text-muted-foreground/20 text-center focus:ring-2 focus:ring-primary/40 focus:bg-background/60 transition-all duration-200"
                        />
                        <span className="text-[9px] text-muted-foreground/60 block text-center mt-1">grams</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Validation errors */}
              {sanityValidation && !sanityValidation.valid && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                  {sanityValidation.errors[0]}
                </motion.div>
              )}

              {/* Health warnings */}
              {showWarnings && (
                <>
                  <HealthWarning calories={parseInt(calories, 10) || 0} protein={protein ? parseInt(protein, 10) : undefined}
                    fiber={fiber ? parseInt(fiber, 10) : undefined} sugar={sugar ? parseInt(sugar, 10) : undefined}
                    mealType={mealType} userGoals={isPro ? userGoals : undefined} />
                  <HealthPositive calories={parseInt(calories, 10) || 0} protein={protein ? parseInt(protein, 10) : undefined}
                    fiber={fiber ? parseInt(fiber, 10) : undefined} sugar={sugar ? parseInt(sugar, 10) : undefined}
                    mealType={mealType} userGoals={isPro ? userGoals : undefined} />
                </>
              )}

              {/* Custom Tags (Pro) */}
              {isPro && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.35, type: 'spring', damping: 18 }}
                  className="relative rounded-2xl p-4 border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden"
                >
                  {/* Background decorative element */}
                  <div className="absolute -bottom-2 -right-2 opacity-[0.06]">
                    <Tag className="w-20 h-20" />
                  </div>

                  <div className="flex gap-2.5 relative z-10">
                    <motion.div 
                      className="flex-1"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, type: 'spring', damping: 15 }}
                    >
                      <Input placeholder="Add a tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        className="h-12 rounded-xl bg-background/40 border-0 text-sm placeholder:text-muted-foreground/30 font-medium" />
                    </motion.div>
                    <motion.div 
                      whileTap={{ scale: 0.85 }}
                      whileHover={{ scale: 1.05 }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.45, type: 'spring', damping: 12 }}
                    >
                      <Button onClick={handleAddTag} size="icon" className="h-12 w-12 rounded-xl flex-shrink-0 shadow-lg shadow-primary/25">
                        <Plus className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  </div>

                  {tags.length > 0 && (
                    <motion.div 
                      className="flex flex-wrap gap-2 mt-3 relative z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {tags.map((tag, i) => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.6, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ delay: i * 0.06, type: 'spring', damping: 12, stiffness: 200 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-br from-primary/20 to-primary/10 text-primary rounded-xl text-xs font-bold border border-primary/25 shadow-sm shadow-primary/10 backdrop-blur-sm"
                        >
                          <Tag className="w-3 h-3" />{tag}
                          <motion.button 
                            whileTap={{ scale: 0.7 }}
                            onClick={() => handleRemoveTag(tag)} 
                            className="ml-1 hover:text-destructive transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </motion.button>
                        </motion.span>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Fixed bottom save button */}
            <motion.div 
              className="p-4 safe-bottom bg-background/95 backdrop-blur-sm border-t border-border/30 flex-shrink-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: 'spring', damping: 20 }}
            >
              {/* Mini progress dots */}
              <div className="flex items-center justify-center gap-1.5 mb-3">
                {['calories', 'protein', 'fiber', 'sugar'].map((key, i) => (
                  <motion.div
                    key={key}
                    className={`w-2 h-2 rounded-full transition-colors ${values[key] ? 'bg-primary' : 'bg-muted/40'}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: values[key] ? [1, 1.4, 1] : 1 }}
                    transition={{ delay: 0.55 + i * 0.05, type: 'spring', damping: 12 }}
                  />
                ))}
              </div>
              <motion.div 
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: 'spring', damping: 16 }}
              >
                <Button onClick={handleSubmit} disabled={!calories || !protein || !fiber || !sugar || isSubmitting}
                  className="w-full h-13 text-base rounded-2xl font-bold shadow-neon gradient-primary">
                  {isSubmitting ? (
                    <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                      Saving...
                    </motion.span>
                  ) : (
                    'Save Meal'
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ProUpgradeModal open={showProModal} onClose={() => setShowProModal(false)} />
    </>
  );
}
