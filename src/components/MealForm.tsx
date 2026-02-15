import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag } from 'lucide-react';
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

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden">
            <div className="relative h-32 bg-black flex-shrink-0">
              {photo && <img src={photo} alt="Meal" className="w-full h-full object-cover opacity-70" />}
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/50" />
              <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-3 left-3 text-white hover:bg-white/10 rounded-full safe-top">
                <X className="w-6 h-6" />
              </Button>
              <h1 className="absolute top-3 left-1/2 -translate-x-1/2 text-white font-bold text-lg safe-top">Log Meal</h1>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4 flex flex-col">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Meal Type</Label>
                <div className="grid grid-cols-4 gap-2">
                  {mealTypes.map(({ value, label }) => {
                    const isAvailable = availableMealTypes.includes(value);
                    return (
                      <button key={value} onClick={() => setMealType(value)} disabled={!isAvailable}
                        className={`py-2.5 px-2 rounded-xl font-semibold text-xs transition-all border ${
                          mealType === value ? 'bg-primary text-primary-foreground shadow-neon border-primary'
                          : isAvailable ? 'bg-secondary/50 text-secondary-foreground hover:bg-secondary border-border/50'
                          : 'bg-muted/30 text-muted-foreground/50 border-border/30 cursor-not-allowed'
                        }`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="calories" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Calories <span className="text-destructive">*</span>
                </Label>
                <Input id="calories" type="number" inputMode="numeric" min="0" max="5000" placeholder="e.g., 450" value={calories}
                  onChange={(e) => setCalories(e.target.value)} className="h-12 text-lg rounded-xl bg-secondary/50 border-border/50 font-semibold" />
              </div>

              {/* Protein, Fiber, Sugar - each on its own line when NOT Pro, 3-col when Pro */}
              {isPro ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="protein" className="text-[10px] font-bold text-muted-foreground uppercase">Protein (g) <span className="text-destructive">*</span></Label>
                    <Input id="protein" type="number" inputMode="numeric" min="0" max="200" placeholder="0" value={protein}
                      onChange={(e) => setProtein(e.target.value)} className="h-11 rounded-xl bg-secondary/50 border-border/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fiber" className="text-[10px] font-bold text-muted-foreground uppercase">Fiber (g) <span className="text-destructive">*</span></Label>
                    <Input id="fiber" type="number" inputMode="numeric" min="0" max="100" placeholder="0" value={fiber}
                      onChange={(e) => setFiber(e.target.value)} className="h-11 rounded-xl bg-secondary/50 border-border/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sugar" className="text-[10px] font-bold text-muted-foreground uppercase">Sugar (g) <span className="text-destructive">*</span></Label>
                    <Input id="sugar" type="number" inputMode="numeric" min="0" max="300" placeholder="0" value={sugar}
                      onChange={(e) => setSugar(e.target.value)} className="h-11 rounded-xl bg-secondary/50 border-border/50" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="protein" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Protein (g) <span className="text-destructive">*</span></Label>
                    <Input id="protein" type="number" inputMode="numeric" min="0" max="200" placeholder="e.g., 25" value={protein}
                      onChange={(e) => setProtein(e.target.value)} className="h-12 rounded-xl bg-secondary/50 border-border/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fiber" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Fiber (g) <span className="text-destructive">*</span></Label>
                    <Input id="fiber" type="number" inputMode="numeric" min="0" max="100" placeholder="e.g., 5" value={fiber}
                      onChange={(e) => setFiber(e.target.value)} className="h-12 rounded-xl bg-secondary/50 border-border/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sugar" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sugar (g) <span className="text-destructive">*</span></Label>
                    <Input id="sugar" type="number" inputMode="numeric" min="0" max="300" placeholder="e.g., 10" value={sugar}
                      onChange={(e) => setSugar(e.target.value)} className="h-12 rounded-xl bg-secondary/50 border-border/50" />
                  </div>
                </div>
              )}

              {sanityValidation && !sanityValidation.valid && (
                <div className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                  {sanityValidation.errors[0]}
                </div>
              )}

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

              {isPro && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Custom Tags</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Add a tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      className="h-11 rounded-xl bg-secondary/50 border-border/50 flex-1" />
                    <Button onClick={handleAddTag} size="icon" className="h-11 w-11 rounded-xl flex-shrink-0">
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/15 text-primary rounded-lg text-sm font-medium border border-primary/20">
                          <Tag className="w-3 h-3" />{tag}
                          <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1" />
            </div>

            <div className="p-4 safe-bottom bg-background border-t border-border/50 flex-shrink-0">
              <Button onClick={handleSubmit} disabled={!calories || !protein || !fiber || !sugar || isSubmitting}
                className="w-full h-12 text-base rounded-xl font-bold shadow-neon">
                {isSubmitting ? 'Saving...' : 'Save Meal'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ProUpgradeModal open={showProModal} onClose={() => setShowProModal(false)} />
    </>
  );
}
