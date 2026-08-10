import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { MealCard } from '@/components/MealCard';
import { MealDetail } from '@/components/MealDetail';
import { PageTransition } from '@/components/PageTransition';
import { Meal } from '@/lib/db';
import { Calendar } from 'lucide-react';
import { staggerContainer, fadeUpBounce } from '@/lib/motion';
import { toDateKey } from '@/lib/date';

export default function Log() {
  const { meals, animationsEnabled } = useApp();
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const noMotion = !animationsEnabled;

  const mealsByDate = useMemo(() => {
    const grouped: Record<string, Meal[]> = {};
    meals.forEach((meal) => {
      if (!grouped[meal.date]) grouped[meal.date] = [];
      grouped[meal.date].push(meal);
    });
    return grouped;
  }, [meals]);

  const sortedDates = useMemo(() => Object.keys(mealsByDate).sort((a, b) => b.localeCompare(a)), [mealsByDate]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === toDateKey(today)) return 'Today';
    if (dateStr === toDateKey(yesterday)) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const getDayTotals = (dateMeals: Meal[]) => ({
    calories: dateMeals.reduce((sum, m) => sum + m.calories, 0),
    count: dateMeals.length,
  });

  return (
    <PageTransition className="min-h-screen pb-24 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-10 pb-4 safe-top">
        <motion.h1 
          initial={noMotion ? false : { opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 150 }}
          className="text-3xl font-bold tracking-tight"
        >
          Food Timeline
        </motion.h1>
      </div>

      {/* Timeline */}
      <div className="px-6 space-y-8 flex-1">
        {sortedDates.length === 0 ? (
          <motion.div 
            initial={noMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="flex flex-col items-center justify-center flex-1 min-h-[50vh]"
          >
            <motion.div
              animate={noMotion ? {} : { y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-muted-foreground" />
            </motion.div>
            <p className="text-muted-foreground">No meals logged yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start by logging your first meal</p>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer(0.12)} initial={noMotion ? false : "hidden"} animate="show">
            {sortedDates.map((date, dateIndex) => {
              const dateMeals = mealsByDate[date];
              const totals = getDayTotals(dateMeals);
              return (
                <motion.div key={date} variants={noMotion ? {} : fadeUpBounce} className="mb-8">
                  <motion.div 
                    className="flex items-center justify-between mb-4"
                    initial={noMotion ? false : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: dateIndex * 0.05, type: 'spring', damping: 15 }}
                  >
                    <div>
                      <h2 className="text-lg font-semibold">{formatDate(date)}</h2>
                      <p className="text-sm text-muted-foreground">
                        {totals.count} meal{totals.count !== 1 ? 's' : ''} • {totals.calories} cal
                      </p>
                    </div>
                  </motion.div>
                  <div className="space-y-3">
                    {dateMeals.map((meal, i) => (
                      <motion.div
                        key={meal.id}
                        initial={noMotion ? false : { opacity: 0, y: 25, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.08, type: 'spring', damping: 14, stiffness: 150 }}
                      >
                        <MealCard meal={meal} onClick={() => setSelectedMeal(meal)} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      <MealDetail meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
    </PageTransition>
  );
}
