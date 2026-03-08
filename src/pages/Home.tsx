import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Flame, Utensils, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { Camera } from '@/components/Camera';
import { MealForm } from '@/components/MealForm';
import { MealCard } from '@/components/MealCard';
import { MealDetail } from '@/components/MealDetail';
import { WaterTracker } from '@/components/WaterTracker';
import { MealReminder } from '@/components/MealReminder';
import { ProgressRing } from '@/components/ProgressRing';
import { StreakDisplay } from '@/components/StreakDisplay';
import { DayCompleteModal } from '@/components/DayCompleteModal';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { PageTransition } from '@/components/PageTransition';
import { PullToRefresh } from '@/components/PullToRefresh';
import { Meal } from '@/lib/db';
import { getGreeting } from '@/lib/userProfile';
import { generateInsight } from '@/lib/streaks';
import { useNavigate } from 'react-router-dom';
import { staggerContainer, fadeUp, fadeUpBounce, prefersReducedMotion } from '@/lib/motion';

export default function Home() {
  const { meals, settings, isLoading, todayWater, incrementWater, userProfile, streak, currentChallenge, refreshMeals, animationsEnabled } = useApp();
  const navigate = useNavigate();
  
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showMealForm, setShowMealForm] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showDayComplete, setShowDayComplete] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = useMemo(() => meals.filter((meal) => meal.date === today), [meals, today]);
  const todayMealTypes = useMemo(() => todaysMeals.map(m => m.mealType), [todaysMeals]);
  const lastMealTime = useMemo(() => todaysMeals.length === 0 ? undefined : todaysMeals[0].time, [todaysMeals]);

  const todayStats = useMemo(() => ({
    calories: todaysMeals.reduce((sum, meal) => sum + meal.calories, 0),
    protein: todaysMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0),
    fiber: todaysMeals.reduce((sum, meal) => sum + (meal.fiber || 0), 0),
    sugar: todaysMeals.reduce((sum, meal) => sum + (meal.sugar || 0), 0),
    mealCount: todaysMeals.length,
  }), [todaysMeals]);

  const calorieProgress = useMemo(() => Math.min((todayStats.calories / settings.goals.calories) * 100, 100), [todayStats.calories, settings.goals.calories]);

  const goalStatus = useMemo(() => {
    const ratio = todayStats.calories / settings.goals.calories;
    if (ratio <= 1) return 'success';
    if (ratio <= 1.15) return 'warning';
    return 'destructive';
  }, [todayStats.calories, settings.goals]);

  const insight = useMemo(() => generateInsight(meals), [meals]);

  const handlePhotoCapture = (photoDataUrl: string) => { setCapturedPhoto(photoDataUrl); setShowMealForm(true); };

  const handleMealLogged = () => {
    setShowMealForm(false);
    setCapturedPhoto(null);
    const mealTypesAfterLog = [...todayMealTypes];
    if (mealTypesAfterLog.includes('breakfast') && mealTypesAfterLog.includes('lunch') && mealTypesAfterLog.includes('dinner')) {
      setTimeout(() => setShowDayComplete(true), 500);
    }
  };

  const handleRefresh = useCallback(async () => {
    await refreshMeals();
    await new Promise(r => setTimeout(r, 600));
  }, [refreshMeals]);

  const noMotion = !animationsEnabled;

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 px-6 pt-10 space-y-4">
        <div className="h-8 w-48 shimmer rounded-lg" />
        <div className="h-20 shimmer rounded-2xl" />
        <div className="h-14 shimmer rounded-2xl" />
        <div className="h-24 shimmer rounded-2xl" />
        <div className="h-48 shimmer rounded-2xl" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <PageTransition className="min-h-screen pb-24">
        {/* Header */}
        <div className="px-6 pt-10 pb-2 safe-top">
          <motion.h1 
            initial={noMotion ? false : { opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring', damping: 12, stiffness: 150 }}
            className="text-xl font-bold text-foreground"
          >
            {getGreeting(userProfile?.name)}
          </motion.h1>
        </div>

        <motion.div variants={staggerContainer(0.12)} initial={noMotion ? false : "hidden"} animate="show" className="px-6 space-y-4">
          {/* Streak Display */}
          <motion.div variants={noMotion ? {} : fadeUpBounce}>
            <StreakDisplay streak={streak} />
          </motion.div>

          {/* Log Meal Button */}
          <motion.div variants={noMotion ? {} : fadeUpBounce}>
            <motion.div 
              whileTap={noMotion ? {} : { scale: 0.88 }}
              whileHover={noMotion ? {} : { scale: 1.05, y: -4 }}
              transition={{ type: 'spring', damping: 10, stiffness: 200 }}
            >
              <Button onClick={() => setShowCamera(true)} className={`w-full h-14 text-base rounded-2xl gradient-primary hover:opacity-90 shadow-neon font-bold ${animationsEnabled ? 'cta-glow animate-shine' : ''}`}>
                <Plus className={`w-5 h-5 mr-2 ${animationsEnabled ? 'animate-wiggle' : ''}`} />Log Meal
              </Button>
            </motion.div>
          </motion.div>

          {/* Current Challenge Preview */}
          <motion.div variants={noMotion ? {} : fadeUpBounce}>
            <motion.button
              whileTap={noMotion ? {} : { scale: 0.93 }}
              whileHover={noMotion ? {} : { y: -6, scale: 1.02 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              onClick={() => navigate('/challenges')}
              className={`w-full bg-card rounded-2xl p-4 border border-border/50 text-left card-interactive ${animationsEnabled ? 'animate-glow-pulse' : ''}`}
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  animate={noMotion ? {} : { 
                    rotate: [0, 15, -15, 0], 
                    scale: [1, 1.25, 1],
                    y: [0, -4, 0],
                  }}
                  transition={{ duration: 0.8, delay: 1, repeat: Infinity, repeatDelay: 3 }}
                  className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase font-bold">
                    {currentChallenge.type === 'daily' ? 'Daily Mission' : 'Weekly Challenge'}
                  </p>
                  <p className="font-semibold truncate">{currentChallenge.title}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">
                    <AnimatedNumber value={currentChallenge.progress} />/{currentChallenge.target}
                  </span>
                </div>
              </div>
            </motion.button>
          </motion.div>

          {/* Meal Reminder */}
          <MealReminder lastMealTime={lastMealTime} todayMealTypes={todayMealTypes} />

          {/* Progress Ring + Stats */}
          <motion.div variants={noMotion ? {} : fadeUpBounce}>
            <div className={`glass rounded-2xl p-5 ${animationsEnabled ? 'animate-shine' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Today's Progress</h2>
                <motion.button
                  whileTap={noMotion ? {} : { scale: 0.85 }}
                  onClick={() => navigate('/dashboard')}
                  className="text-primary text-sm font-semibold flex items-center gap-0.5 hover:gap-1.5 transition-all"
                >
                  Details <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="flex items-center gap-6">
                <div className={animationsEnabled ? 'animate-ring-pulse' : ''}>
                  <ProgressRing progress={calorieProgress} size={120} strokeWidth={10} showAnimation={calorieProgress >= 100}>
                    <div className="text-center">
                      <div className="text-2xl font-extrabold">
                        <AnimatedNumber value={todayStats.calories} />
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium">/ {settings.goals.calories}</div>
                    </div>
                  </ProgressRing>
                </div>
                <div className="flex-1 space-y-2">
                  {[
                    { label: 'Meals', value: todayStats.mealCount.toString() },
                    { label: 'Protein', value: `${todayStats.protein}g` },
                    { label: 'Water', value: `${todayWater}/${settings.waterGoal}` },
                  ].map((stat, i) => (
                    <motion.div key={stat.label} 
                      initial={noMotion ? false : { opacity: 0, x: 40, scale: 0.8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.12, type: 'spring', damping: 12, stiffness: 150 }}
                      className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg">
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                      <span className="font-bold">{stat.value}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              {goalStatus === 'destructive' && (
                <motion.div 
                  initial={noMotion ? false : { opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 150 }}
                  className={`mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 ${animationsEnabled ? 'animate-shake' : ''}`}>
                  <Flame className="w-4 h-4 text-destructive" />
                  <span className="text-xs font-semibold text-destructive">You've exceeded your calorie goal</span>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Insight */}
          {insight && (
            <motion.div variants={noMotion ? {} : fadeUpBounce}>
              <motion.div
                initial={noMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className={`bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20 ${animationsEnabled ? 'animate-glow-pulse' : ''}`}>
                <p className="text-sm font-medium text-primary">{insight}</p>
              </motion.div>
            </motion.div>
          )}

          {/* Water Tracker */}
          <motion.div variants={noMotion ? {} : fadeUpBounce}>
            <WaterTracker glasses={todayWater} goal={settings.waterGoal} onIncrement={incrementWater} />
          </motion.div>
        </motion.div>

        {/* Today's Meals */}
        {todaysMeals.length > 0 && (
          <motion.div 
            initial={noMotion ? false : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring', damping: 14 }}
            className="mt-4"
          >
            <div className="px-6 mb-3">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Today's Meals</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
              {todaysMeals.map((meal, i) => (
                <motion.div
                  key={meal.id}
                  initial={noMotion ? false : { opacity: 0, scale: 0.6, y: 25, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, type: 'spring', damping: 10, stiffness: 150 }}
                >
                  <MealCard meal={meal} compact onClick={() => setSelectedMeal(meal)} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {todaysMeals.length === 0 && (
          <motion.div initial={noMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="px-6 py-10 text-center">
            <motion.div 
              animate={noMotion ? {} : { y: [0, -12, 0], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border/50">
              <Utensils className="w-8 h-8 text-muted-foreground" />
            </motion.div>
            <p className="text-muted-foreground font-semibold">No meals logged today</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Tap the button above to get started</p>
          </motion.div>
        )}

        <Camera open={showCamera} onClose={() => setShowCamera(false)} onCapture={handlePhotoCapture} />
        <MealForm open={showMealForm} photo={capturedPhoto} onClose={() => { setShowMealForm(false); setCapturedPhoto(null); }} onSuccess={handleMealLogged} />
        <MealDetail meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
        <DayCompleteModal open={showDayComplete} onClose={() => setShowDayComplete(false)} totalCalories={todayStats.calories} totalMeals={todayStats.mealCount} />
      </PageTransition>
    </PullToRefresh>
  );
}
