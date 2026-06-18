import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Trophy, X, CheckCircle2, Circle, Award, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Challenge, Badge, getEarnedBadges, REFLECTION_QUESTIONS, saveLastReflection, getLastReflection, ReflectionData } from '@/lib/streaks';
import { useApp } from '@/contexts/AppContext';

interface ChallengesPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ChallengesPanel({ open, onClose }: ChallengesPanelProps) {
  const { currentChallenge, badges, meals, todayWater, settings } = useApp();
  const [showReflection, setShowReflection] = useState(false);
  const [lastReflection, setLastReflection] = useState<ReflectionData | null>(null);

  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const reflectionQuestion = REFLECTION_QUESTIONS[weekNumber % REFLECTION_QUESTIONS.length];

  useEffect(() => {
    if (open) getLastReflection().then(setLastReflection);
  }, [open]);

  const hasReflectedThisWeek = lastReflection && lastReflection.weekNumber === weekNumber;

  const thisWeekStart = weekNumber * 7 * 24 * 60 * 60 * 1000;
  const thisWeekMeals = meals.filter((m) => new Date(m.date).getTime() >= thisWeekStart);

  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = useMemo(() => meals.filter((m) => m.date === today), [meals, today]);

  const availableChallenges = useMemo(() => {
    const waterTarget = settings.waterGoal;
    const items = [
      { id: 'daily_meals_3', title: 'Log 3 meals today', type: 'daily' as const, progress: Math.min(todaysMeals.length, 3), target: 3 },
      { id: 'daily_water', title: `Drink ${waterTarget} glasses of water`, type: 'daily' as const, progress: Math.min(todayWater, waterTarget), target: waterTarget },
    ].map((c) => ({ ...c, completed: c.progress >= c.target }));
    return items.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
  }, [settings.waterGoal, todaysMeals.length, todayWater]);

  const handleReflectionSelect = async (mealId: string) => {
    await saveLastReflection(weekNumber, mealId);
    setLastReflection({ weekNumber, mealId, answeredAt: Date.now() });
    setShowReflection(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background flex flex-col">
          <div className="px-6 pt-8 pb-4 safe-top border-b border-border/50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Challenges</h1>
                <p className="text-muted-foreground text-sm">Daily missions & achievements</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 pb-24 space-y-6">
            <div className="bg-card rounded-2xl p-5 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  {currentChallenge.type === 'daily' ? 'Daily Mission' : 'Weekly Challenge'}
                </h2>
              </div>
              <p className="font-semibold text-lg mb-3">{currentChallenge.title}</p>
              <p className="text-sm text-muted-foreground mb-4">{currentChallenge.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-bold">{currentChallenge.progress} / {currentChallenge.target}</span>
                </div>
                <Progress value={(currentChallenge.progress / currentChallenge.target) * 100} className="h-3" />
              </div>
              {currentChallenge.completed && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 flex items-center gap-2 text-primary bg-primary/10 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Challenge Complete!</span>
                </motion.div>
              )}
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Weekly Reflection</h2>
              </div>
              <p className="font-medium mb-4">{reflectionQuestion}</p>
              {hasReflectedThisWeek ? (
                <div className="flex items-center gap-2 text-primary bg-primary/10 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Reflected this week</span>
                </div>
              ) : thisWeekMeals.length > 0 ? (
                <Button onClick={() => setShowReflection(true)} variant="outline" className="w-full rounded-xl">
                  <span>Choose a meal</span>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">Log meals this week to reflect on them</p>
              )}
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-amber-500" />
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Your Badges</h2>
              </div>
              {badges.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {badges.map((badge) => (
                    <div key={badge.id} className="flex flex-col items-center text-center p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/15">
                      <span className="text-2xl mb-1">{badge.icon}</span>
                      <span className="text-xs font-semibold">{badge.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Complete challenges to earn badges!</p>
              )}
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border/50">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Available Challenges</h2>
              <div className="space-y-3">
                {availableChallenges.map((challenge) => (
                  <div key={challenge.id} className="p-3 bg-secondary/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      {challenge.completed ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{challenge.title}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{challenge.type} • {challenge.progress}/{challenge.target}</p>
                      </div>
                    </div>
                    <div className="mt-2"><Progress value={(challenge.progress / challenge.target) * 100} className="h-2" /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showReflection && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] bg-black/80 flex items-end" onClick={() => setShowReflection(false)}>
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  onClick={(e) => e.stopPropagation()} className="w-full max-h-[70vh] bg-background rounded-t-3xl p-6 overflow-y-auto">
                  <h3 className="text-lg font-bold mb-4">{reflectionQuestion}</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {thisWeekMeals.slice(0, 9).map((meal) => (
                      <button key={meal.id} onClick={() => handleReflectionSelect(meal.id)}
                        className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all">
                        <img src={meal.photo} alt="Meal" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
