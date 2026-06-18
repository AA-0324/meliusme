import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Trophy, CheckCircle2, Circle, ChevronRight, Zap, Gift, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { REFLECTION_QUESTIONS, saveLastReflection, getDailyChallenges, getLastWeekNumber, getLastWeekStart, ReflectionData } from '@/lib/streaks';
import { useApp } from '@/contexts/AppContext';
import { staggerContainer, fadeUpBounce } from '@/lib/motion';

export default function Challenges() {
  const { currentChallenge, meals, todayWater, settings, xpData, tempProUnlocks, animationsEnabled } = useApp();
  const [showReflection, setShowReflection] = useState(false);
  const [lastReflection, setLastReflection] = useState<ReflectionData | null>(null);
  const noMotion = !animationsEnabled;

  const lastWeekNumber = getLastWeekNumber();
  const lastWeekStart = getLastWeekStart();
  const reflectionQuestion = REFLECTION_QUESTIONS[lastWeekNumber % REFLECTION_QUESTIONS.length];

  const hasReflectedLastWeek = lastReflection && lastReflection.weekNumber === lastWeekNumber;

  const lastWeekStartDate = new Date(lastWeekStart);
  // Calculate this week's Monday to exclude today's meals from last week's reflection
  const thisWeekStartDate = new Date();
  const day = thisWeekStartDate.getDay();
  const diff = thisWeekStartDate.getDate() - day + (day === 0 ? -6 : 1);
  const thisWeekMonday = new Date(thisWeekStartDate.getFullYear(), thisWeekStartDate.getMonth(), diff);
  thisWeekMonday.setHours(0, 0, 0, 0);

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

  const handleReflectionSelect = async (mealId: string) => {
    await saveLastReflection(lastWeekNumber, mealId);
    setLastReflection({ weekNumber: lastWeekNumber, mealId, answeredAt: Date.now() });
    setShowReflection(false);
  };

  const xpPercent = xpData.xpToNextLevel > 0 ? (xpData.currentLevelXP / xpData.xpToNextLevel) * 100 : 0;
  const nextRewardLevel = xpData.level % 2 === 0 ? xpData.level + 2 : xpData.level + 1;

  const formatTimeLeft = (expiresAt: number) => {
    const ms = expiresAt - Date.now();
    if (ms <= 0) return 'Expired';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
    return `${hours}h left`;
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-6 pt-10 pb-4 safe-top">
        <motion.h1 
          initial={noMotion ? false : { opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 150 }}
          className="text-3xl font-bold tracking-tight"
        >
          Challenges
        </motion.h1>
      </div>

      <motion.div 
        variants={staggerContainer(0.12)} 
        initial={noMotion ? false : "hidden"} 
        animate="show"
        className="px-6 space-y-4"
      >
        {/* XP Level Bar */}
        <motion.div variants={noMotion ? {} : fadeUpBounce}
          className={`bg-card rounded-2xl p-4 border border-border/50 ${animationsEnabled ? 'animate-glow-pulse' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <motion.div
                animate={noMotion ? {} : { rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, delay: 0.5, repeat: Infinity, repeatDelay: 3 }}
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
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Next reward at Level {nextRewardLevel}
          </p>
        </motion.div>

        {/* Active Temp Pro Unlocks */}
        {tempProUnlocks.length > 0 && (
          <motion.div variants={noMotion ? {} : fadeUpBounce} className="space-y-2">
            {tempProUnlocks.map((unlock, i) => (
              <motion.div 
                key={unlock.featureId + unlock.unlockedAt}
                initial={noMotion ? false : { opacity: 0, x: -30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: i * 0.1, type: 'spring', damping: 12 }}
                className={`bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20 ${animationsEnabled ? 'animate-shine' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <motion.div 
                    animate={noMotion ? {} : { rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0"
                  >
                    <Gift className="w-4 h-4 text-primary" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Active Reward</p>
                    <p className="font-semibold text-sm truncate">{unlock.featureName}</p>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-medium">{formatTimeLeft(unlock.expiresAt)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Weekly Challenge */}
        <motion.div variants={noMotion ? {} : fadeUpBounce}
          className={`bg-card rounded-2xl p-5 border border-border/50 ${animationsEnabled ? 'animate-shine' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            <motion.div
              animate={noMotion ? {} : { rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <Target className="w-5 h-5 text-primary" />
            </motion.div>
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
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>
          {currentChallenge.completed && (
            <motion.div 
              initial={noMotion ? false : { opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 10, stiffness: 150 }}
              className="mt-4 flex items-center gap-2 text-primary bg-primary/10 rounded-xl px-4 py-3"
            >
              <motion.div
                animate={noMotion ? {} : { scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <CheckCircle2 className="w-5 h-5" />
              </motion.div>
              <span className="font-semibold">Challenge Complete!</span>
            </motion.div>
          )}
        </motion.div>

        {/* Daily Challenges */}
        <motion.div variants={noMotion ? {} : fadeUpBounce}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Daily Challenges</h2>
          </div>
          <div className="space-y-3">
            {dailyChallenges.map((challenge, i) => (
              <motion.div key={challenge.id}
                initial={noMotion ? false : { opacity: 0, x: -40, scale: 0.85 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.08, type: 'spring', damping: 12, stiffness: 150 }}
                className="p-3 bg-secondary/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <motion.div 
                    animate={challenge.completed && !noMotion ? { scale: [1, 1.4, 1], rotate: [0, 10, 0] } : {}}
                    transition={{ duration: 0.5, repeat: challenge.completed ? Infinity : 0, repeatDelay: 2 }}
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
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 + i * 0.08 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Weekly Reflection */}
        <motion.div variants={noMotion ? {} : fadeUpBounce}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              animate={noMotion ? {} : { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            >
              <Trophy className="w-5 h-5 text-amber-500" />
            </motion.div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Last Week's Reflection</h2>
          </div>
          <p className="font-medium mb-3">{reflectionQuestion}</p>
          {hasReflectedLastWeek ? (
            <motion.div 
              initial={noMotion ? false : { scale: 0.7 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="flex items-center gap-2 text-primary bg-primary/10 rounded-xl px-4 py-3"
            >
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
      </motion.div>

      {/* Reflection Modal */}
      <AnimatePresence>
        {showReflection && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 flex items-end" 
            onClick={() => setShowReflection(false)}
          >
            <motion.div 
              initial={{ y: '100%', scale: 0.95 }} 
              animate={{ y: 0, scale: 1 }} 
              exit={{ y: '100%', scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[70vh] bg-background rounded-t-3xl p-6 overflow-y-auto"
            >
              <h3 className="text-lg font-bold mb-4">{reflectionQuestion}</h3>
              <div className="grid grid-cols-3 gap-3">
                {lastWeekMeals.slice(0, 9).map((meal, i) => (
                  <motion.button 
                    key={meal.id} 
                    onClick={() => handleReflectionSelect(meal.id)}
                    initial={noMotion ? false : { opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, type: 'spring', damping: 12 }}
                    whileHover={noMotion ? {} : { scale: 1.08 }}
                    whileTap={noMotion ? {} : { scale: 0.9 }}
                    className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                  >
                    <img src={meal.photo} alt="Meal" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
