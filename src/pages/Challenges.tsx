import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Trophy, CheckCircle2, Circle, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { REFLECTION_QUESTIONS, saveLastReflection, getLastReflection, getDailyChallenges, getXPData, getLastWeekNumber, getLastWeekStart } from '@/lib/streaks';
import { useApp } from '@/contexts/AppContext';

export default function Challenges() {
  const { currentChallenge, meals, todayWater, settings } = useApp();
  const [showReflection, setShowReflection] = useState(false);

  const xpData = getXPData();

  const lastWeekNumber = getLastWeekNumber();
  const lastWeekStart = getLastWeekStart();
  const reflectionQuestion = REFLECTION_QUESTIONS[lastWeekNumber % REFLECTION_QUESTIONS.length];
  const lastReflection = getLastReflection();
  const hasReflectedLastWeek = lastReflection && lastReflection.weekNumber === lastWeekNumber;

  const lastWeekStartDate = new Date(lastWeekStart);
  const thisWeekStartDate = new Date();
  const day = thisWeekStartDate.getDay();
  const diff = thisWeekStartDate.getDate() - day + (day === 0 ? -6 : 1);
  const thisWeekMonday = new Date(thisWeekStartDate.getFullYear(), thisWeekStartDate.getMonth(), diff);

  const lastWeekMeals = meals.filter((m) => {
    const mealDate = new Date(m.date);
    return mealDate >= lastWeekStartDate && mealDate < thisWeekMonday;
  });

  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = useMemo(() => meals.filter((m) => m.date === today), [meals, today]);
  const todaysMealTypes = useMemo(() => todaysMeals.map(m => m.mealType), [todaysMeals]);

  const todayStats = useMemo(() => ({
    calories: todaysMeals.reduce((sum, m) => sum + m.calories, 0),
    protein: todaysMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
  }), [todaysMeals]);

  const dailyChallenges = useMemo(() => {
    return getDailyChallenges(todaysMealTypes, todayWater, settings.waterGoal, settings.goals, todayStats.calories, todayStats.protein);
  }, [todaysMealTypes, todayWater, settings.waterGoal, settings.goals, todayStats.calories, todayStats.protein]);

  const handleReflectionSelect = (mealId: string) => {
    saveLastReflection(lastWeekNumber, mealId);
    setShowReflection(false);
  };

  const xpPercent = (xpData.currentLevelXP / xpData.xpToNextLevel) * 100;

  return (
    <div className="min-h-screen pb-24">
      <div className="px-6 pt-8 pb-4 safe-top">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold">
          Challenges
        </motion.h1>
        <p className="text-muted-foreground mt-1">Daily missions & achievements</p>
      </div>

      <div className="px-6 space-y-4">
        {/* XP Level Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}
          className="bg-card rounded-2xl p-4 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </motion.div>
              <div>
                <p className="text-sm font-bold">Level {xpData.level}</p>
                <p className="text-[10px] text-muted-foreground">{xpData.totalXP} XP total</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{xpData.currentLevelXP}/{xpData.xpToNextLevel} XP</span>
          </div>
          <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </motion.div>

        {/* Weekly Challenge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Weekly Challenge</h2>
          </div>
          <p className="font-semibold text-lg mb-3">{currentChallenge.title}</p>
          <p className="text-sm text-muted-foreground mb-4">{currentChallenge.description}</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-bold">{currentChallenge.progress} / {currentChallenge.target}</span>
            </div>
            <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((currentChallenge.progress / currentChallenge.target) * 100, 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>
          {currentChallenge.completed && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="mt-4 flex items-center gap-2 text-primary bg-primary/10 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Challenge Complete!</span>
            </motion.div>
          )}
        </motion.div>

        {/* Daily Challenges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Daily Challenges</h2>
          </div>
          <div className="space-y-3">
            {dailyChallenges.map((challenge, i) => (
              <motion.div key={challenge.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="p-3 bg-secondary/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={challenge.completed ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {challenge.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </motion.div>
                  <p className={`font-medium text-sm flex-1 ${challenge.completed ? 'line-through text-muted-foreground' : ''}`}>{challenge.title}</p>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold">{challenge.progress}/{challenge.target}</span>
                    <p className="text-[10px] text-primary font-semibold">+{challenge.xp} XP</p>
                  </div>
                </div>
                <div className="mt-2 relative h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((challenge.progress / challenge.target) * 100, 100)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 + i * 0.05 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Weekly Reflection */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Last Week's Reflection</h2>
          </div>
          <p className="font-medium mb-4">{reflectionQuestion}</p>
          {hasReflectedLastWeek ? (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="flex items-center gap-2 text-primary bg-primary/10 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Reflected on last week</span>
            </motion.div>
          ) : lastWeekMeals.length > 0 ? (
            <Button onClick={() => setShowReflection(true)} variant="outline" className="w-full rounded-xl">
              <span>Choose a meal from last week</span>
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">No meals logged last week to reflect on</p>
          )}
        </motion.div>
      </div>

      {/* Reflection Modal */}
      <AnimatePresence>
        {showReflection && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 flex items-end" onClick={() => setShowReflection(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[70vh] bg-background rounded-t-3xl p-6 overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">{reflectionQuestion}</h3>
              <div className="grid grid-cols-3 gap-3">
                {lastWeekMeals.slice(0, 9).map((meal) => (
                  <button key={meal.id} onClick={() => handleReflectionSelect(meal.id)}
                    className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all">
                    <img src={meal.photo} alt="Meal" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
