import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { ProBadge } from '@/components/ProBadge';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { HealthWarning } from '@/components/HealthWarning';

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

// Get suggested meal type based on current time
function getSuggestedMealType(): MealType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'snack';
  if (hour >= 18 && hour < 22) return 'dinner';
  return 'snack';
}

export function MealForm({ open, photo, onClose, onSuccess }: MealFormProps) {
  const { logMeal, isPro } = useApp();
  const [showProModal, setShowProModal] = useState(false);

  const now = new Date();
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [mealType, setMealType] = useState<MealType>(getSuggestedMealType());
  const [date, setDate] = useState(now.toISOString().split('T')[0]);
  const [time, setTime] = useState(now.toTimeString().slice(0, 5));
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update meal type when form opens
  useEffect(() => {
    if (open) {
      setMealType(getSuggestedMealType());
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toTimeString().slice(0, 5));
    }
  }, [open]);

  // Compute health warnings in real-time
  const showWarnings = useMemo(() => {
    return calories && parseInt(calories, 10) > 0;
  }, [calories]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!photo || !calories || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await logMeal({
        photo,
        calories: parseInt(calories, 10),
        protein: protein ? parseInt(protein, 10) : undefined,
        fiber: fiber ? parseInt(fiber, 10) : undefined,
        sugar: sugar ? parseInt(sugar, 10) : undefined,
        mealType,
        date,
        time,
        tags: tags.length > 0 ? tags : undefined,
      });
      onSuccess();
      // Reset form
      setCalories('');
      setProtein('');
      setFiber('');
      setSugar('');
      setTags([]);
    } catch (error) {
      console.error('Failed to log meal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProFeatureClick = () => {
    if (!isPro) {
      setShowProModal(true);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background flex flex-col"
          >
            {/* Header with photo preview */}
            <div className="relative h-40 bg-black flex-shrink-0">
              {photo && (
                <img
                  src={photo}
                  alt="Meal"
                  className="w-full h-full object-cover opacity-70"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/50" />
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 left-4 text-white hover:bg-white/10 rounded-full"
              >
                <X className="w-6 h-6" />
              </Button>
              <h1 className="absolute top-4 left-1/2 -translate-x-1/2 text-white font-bold text-lg">
                Log Meal
              </h1>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Meal type */}
              <div className="space-y-2.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Meal Type</Label>
                <div className="grid grid-cols-4 gap-2">
                  {mealTypes.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setMealType(value)}
                      className={`flex items-center justify-center py-3 px-2 rounded-xl font-semibold text-sm transition-all border ${
                        mealType === value
                          ? 'bg-primary text-primary-foreground shadow-neon border-primary'
                          : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary border-border/50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calories - Required */}
              <div className="space-y-2">
                <Label htmlFor="calories" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Calories <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="calories"
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g., 450"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="h-14 text-lg rounded-xl bg-secondary/50 border-border/50 font-semibold"
                />
              </div>

              {/* Optional macros */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="protein" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Protein (g)
                  </Label>
                  <Input
                    id="protein"
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="h-12 rounded-xl bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiber" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Fiber (g)
                  </Label>
                  <Input
                    id="fiber"
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={fiber}
                    onChange={(e) => setFiber(e.target.value)}
                    className="h-12 rounded-xl bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sugar" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Sugar (g)
                  </Label>
                  <Input
                    id="sugar"
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={sugar}
                    onChange={(e) => setSugar(e.target.value)}
                    className="h-12 rounded-xl bg-secondary/50 border-border/50"
                  />
                </div>
              </div>

              {/* Health Warning - Real-time */}
              {showWarnings && (
                <HealthWarning
                  calories={parseInt(calories, 10) || 0}
                  protein={protein ? parseInt(protein, 10) : undefined}
                  fiber={fiber ? parseInt(fiber, 10) : undefined}
                  sugar={sugar ? parseInt(sugar, 10) : undefined}
                  mealType={mealType}
                />
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-12 rounded-xl bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="h-12 rounded-xl bg-secondary/50 border-border/50"
                  />
                </div>
              </div>

              {/* Tags - Pro feature */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Custom Tags</Label>
                  {!isPro && <ProBadge />}
                </div>
                {isPro ? (
                  <>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        className="h-12 rounded-xl bg-secondary/50 border-border/50 flex-1"
                      />
                      <Button onClick={handleAddTag} size="icon" className="h-12 w-12 rounded-xl">
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/15 text-primary rounded-lg text-sm font-medium border border-primary/20"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={handleProFeatureClick}
                    className="w-full h-12 rounded-xl border border-dashed border-border/50 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <Tag className="w-4 h-4" />
                    <span className="text-sm">Unlock with Pro</span>
                  </button>
                )}
              </div>
            </div>

            {/* Submit button - Fixed at bottom */}
            <div className="p-5 safe-bottom bg-background border-t border-border/50 flex-shrink-0">
              <Button
                onClick={handleSubmit}
                disabled={!calories || isSubmitting}
                className="w-full h-14 text-lg rounded-xl font-bold shadow-neon"
              >
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
