import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Flame, Utensils, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { Camera } from '@/components/Camera';
import { MealForm } from '@/components/MealForm';
import { MealCard } from '@/components/MealCard';
import { MealDetail } from '@/components/MealDetail';
import { Meal } from '@/lib/db';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const { meals, settings, isLoading } = useApp();
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
      {/* Header */}
      <div className="px-6 pt-8 pb-4 safe-top">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold"
        >
          Melius
        </motion.h1>
        <p className="text-muted-foreground mt-1">Track your nutrition</p>
      </div>

      {/* Main Log Button */}
      <div className="px-6 py-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            onClick={() => setShowCamera(true)}
            className="w-full h-16 text-xl rounded-2xl shadow-lg shadow-primary/25"
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
        transition={{ delay: 0.2 }}
        className="px-6 py-4"
      >
        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Today's Summary</h2>
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-primary text-sm font-medium flex items-center"
            >
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Calories */}
            <div className={`rounded-2xl p-4 ${
              goalStatus === 'success' ? 'bg-primary/10' : 
              goalStatus === 'warning' ? 'bg-warning/10' : 'bg-destructive/10'
            }`}>
              <div className={`flex items-center gap-2 mb-1 ${
                goalStatus === 'success' ? 'text-primary' : 
                goalStatus === 'warning' ? 'text-warning' : 'text-destructive'
              }`}>
                <Flame className="w-5 h-5" />
                <span className="text-sm font-medium">Calories</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{todayStats.calories}</span>
                <span className="text-muted-foreground text-sm">/ {settings.goals.calories}</span>
              </div>
            </div>

            {/* Meal count */}
            <div className="bg-secondary rounded-2xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Utensils className="w-5 h-5" />
                <span className="text-sm font-medium">Meals</span>
              </div>
              <span className="text-3xl font-bold">{todayStats.mealCount}</span>
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
                  goalStatus === 'success' ? 'bg-primary' : 
                  goalStatus === 'warning' ? 'bg-warning' : 'bg-destructive'
                }`}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Today's Meals Carousel */}
      {todaysMeals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="py-4"
        >
          <div className="px-6 mb-3">
            <h2 className="text-lg font-semibold">Today's Meals</h2>
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
          className="px-6 py-8 text-center"
        >
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No meals logged today</p>
          <p className="text-sm text-muted-foreground mt-1">Tap the button above to get started</p>
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
