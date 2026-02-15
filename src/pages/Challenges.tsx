import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Trophy, CheckCircle2, Circle, Award, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { REFLECTION_QUESTIONS, saveLastReflection, getLastReflection, getDailyChallenges, getXPData, getLastWeekNumber, getLastWeekStart } from '@/lib/streaks';
import { useApp } from '@/contexts/AppContext';

export default function Challenges() {
  const { currentChallenge, badges, meals, todayWater, settings } = useApp();
  const [showReflection, setShowReflection] = useState(false);

  // XP data
  const xpData = getXPData();

  // Weekly reflection should only be for LAST week
  const currentWeekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const lastWeekNumber = getLastWeekNumber();
  const lastWeekStart = getLastWeekStart();
  const reflectionQuestion = REFLECTION_QUESTIONS[lastWeekNumber % REFLECTION_QUESTIONS.length];
  const lastReflection = getLastReflection();
  const hasReflectedLastWeek = lastReflection && lastReflection.weekNumber === lastWeekNumber;

  // Get LAST week's meals for reflection
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

  // Get 3 randomized daily challenges with proper meal type tracking
  const dailyChallenges = useMemo(() => {
    return getDailyChallenges(todaysMealTypes, todayWater, settings.waterGoal, settings.goals, todayStats.calories, todayStats.protein);
  }, [todaysMealTypes, todayWater, settings.waterGoal, settings.goals, todayStats.calories, todayStats.protein]);

  const handleReflectionSelect = (mealId: string) => {
    saveLastReflection(lastWeekNumber, mealId);
    setShowReflection(false);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
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
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">Level {xpData.level}</p>
                <p className="text-[10px] text-muted-foreground">{xpData.totalXP} XP total</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{xpData.currentLevelXP}/{xpData.xpToNextLevel} XP</span>
          </div>
          <Progress value={(xpData.currentLevelXP / xpData.xpToNextLevel) * 100} className="h-2" />
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
            <Progress value={(currentChallenge.progress / currentChallenge.target) * 100} className="h-3" />
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
            {dailyChallenges.map((challenge) => (
              <div key={challenge.id} className="p-3 bg-secondary/30 rounded-xl">
                <div className="flex items-center gap-3">
                  {challenge.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <p className="font-medium text-sm flex-1">{challenge.title}</p>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold">{challenge.progress}/{challenge.target}</span>
                    <p className="text-[10px] text-primary font-semibold">+{challenge.xp} XP</p>
                  </div>
                </div>
                <div className="mt-2">
                  <Progress value={(challenge.progress / challenge.target) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Weekly Reflection - only available after the week is over */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Last Week's Reflection</h2>
          </div>
          <p className="font-medium mb-4">{reflectionQuestion}</p>
          {hasReflectedLastWeek ? (
            <div className="flex items-center gap-2 text-primary bg-primary/10 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Reflected on last week</span>
            </div>
          ) : lastWeekMeals.length > 0 ? (
            <Button onClick={() => setShowReflection(true)} variant="outline" className="w-full rounded-xl">
              <span>Choose a meal from last week</span>
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">No meals logged last week to reflect on</p>
          )}
        </motion.div>

        {/* Earned Badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Your Badges</h2>
          </div>
          {badges.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {badges.map((badge) => (
                <div key={badge.id}
                  className="flex flex-col items-center text-center p-3 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
                  <span className="text-2xl mb-1">{badge.icon}</span>
                  <span className="text-xs font-semibold">{badge.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Complete challenges to earn badges!</p>
          )}
        </motion.div>
      </div>

      {/* Reflection Modal - shows LAST week's meals */}
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
