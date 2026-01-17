import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Flame, Utensils, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { Camera } from '@/components/Camera';
import { MealForm } from '@/components/MealForm';
import { MealCard } from '@/components/MealCard';
import { MealDetail } from '@/components/MealDetail';
import { WaterTracker } from '@/components/WaterTracker';
import { MealReminder } from '@/components/MealReminder';
import { Meal } from '@/lib/db';
import { getGreeting } from '@/lib/userProfile';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const { meals, settings, isLoading, todayWater, incrementWater, userProfile } = useApp();
  const navigate = useNavigate();
  
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showMealForm, setShowMealForm] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  
  // Filter today's meals
  const todaysMeals = useMemo(() => {
    return meals.filter((meal) => meal.date === today);
  }, [meals, today]);

  // Get meal types logged today
  const todayMealTypes = useMemo(() => {
    return todaysMeals.map(m => m.mealType);
  }, [todaysMeals]);

  // Get last meal time
  const lastMealTime = useMemo(() => {
    if (todaysMeals.length === 0) return undefined;
    return todaysMeals[0].time;
  }, [todaysMeals]);

  // Calculate today's totals
  const todayStats = useMemo(() => {
    return {
      calories: todaysMeals.reduce((sum, meal) => sum + meal.calories, 0),
      mealCount: todaysMeals.length,
    };
  }, [todaysMeals]);

  // Calculate goal status
  const goalStatus = useMemo(() => {
    const { calories } = settings.goals;
    const ratio = todayStats.calories / calories;
    if (ratio <= 1) return 'success';
    if (ratio <= 1.15) return 'warning';
    return 'destructive';
  }, [todayStats.calories, settings.goals]);

  const handlePhotoCapture = (photoDataUrl: string) => {
    setCapturedPhoto(photoDataUrl);
    setShowMealForm(true);
  };

  const handleMealLogged = () => {
    setShowMealForm(false);
    setCapturedPhoto(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header - Greeting */}
      <div className="px-6 pt-10 pb-2 safe-top">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-foreground"
        >
          {getGreeting(userProfile?.name)}
        </motion.h1>
      </div>

      {/* Meal Reminder */}
      <div className="px-6 py-2">
        <MealReminder lastMealTime={lastMealTime} todayMealTypes={todayMealTypes} />
      </div>

      {/* Main Log Button */}
      <div className="px-6 py-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            onClick={() => setShowCamera(true)}
            className="w-full h-16 text-lg rounded-2xl gradient-primary hover:opacity-90 shadow-neon font-bold tracking-wide"
          >
            <Plus className="w-6 h-6 mr-2" />
            Log a Meal
          </Button>
        </motion.div>
      </div>

      {/* Today's Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="px-6 py-3"
      >
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Today</h2>
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-primary text-sm font-semibold flex items-center gap-0.5 hover:gap-1.5 transition-all"
            >
              Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Calories */}
            <div className={`rounded-xl p-4 ${
              goalStatus === 'success' ? 'bg-primary/15 border border-primary/20' : 
              goalStatus === 'warning' ? 'bg-warning/15 border border-warning/20' : 'bg-destructive/15 border border-destructive/20'
            }`}>
              <div className={`flex items-center gap-2 mb-1 ${
                goalStatus === 'success' ? 'text-primary' : 
                goalStatus === 'warning' ? 'text-warning' : 'text-destructive'
              }`}>
                <Flame className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Calories</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">{todayStats.calories}</span>
                <span className="text-muted-foreground text-xs font-medium">/ {settings.goals.calories}</span>
              </div>
            </div>

            {/* Meal count */}
            <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Utensils className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Meals</span>
              </div>
              <span className="text-3xl font-extrabold">{todayStats.mealCount}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((todayStats.calories / settings.goals.calories) * 100, 100)}%` }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`h-full rounded-full ${
                  goalStatus === 'success' ? 'bg-primary shadow-glow' : 
                  goalStatus === 'warning' ? 'bg-warning' : 'bg-destructive'
                }`}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Water Tracker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-6 py-3"
      >
        <WaterTracker
          glasses={todayWater}
          goal={settings.waterGoal}
          onIncrement={incrementWater}
        />
      </motion.div>

      {/* Today's Meals Carousel */}
      {todaysMeals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="py-3"
        >
          <div className="px-6 mb-3">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Today's Meals</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
            {todaysMeals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                compact
                onClick={() => setSelectedMeal(meal)}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {todaysMeals.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="px-6 py-10 text-center"
        >
          <div className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border/50">
            <Utensils className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-semibold">No meals logged today</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Tap the button above to get started</p>
        </motion.div>
      )}

      {/* Camera */}
      <Camera
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handlePhotoCapture}
      />

      {/* Meal Form */}
      <MealForm
        open={showMealForm}
        photo={capturedPhoto}
        onClose={() => {
          setShowMealForm(false);
          setCapturedPhoto(null);
        }}
        onSuccess={handleMealLogged}
      />

      {/* Meal Detail */}
      <MealDetail
        meal={selectedMeal}
        onClose={() => setSelectedMeal(null)}
      />
    </div>
  );
}
