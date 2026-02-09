import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { MealCard } from '@/components/MealCard';
import { MealDetail } from '@/components/MealDetail';
import { Meal } from '@/lib/db';
import { Calendar } from 'lucide-react';

export default function Log() {
  const { meals } = useApp();
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

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
    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const getDayTotals = (dateMeals: Meal[]) => ({
    calories: dateMeals.reduce((sum, m) => sum + m.calories, 0),
    count: dateMeals.length,
  });

  return (
    <div className="min-h-screen pb-24 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 safe-top">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold">
          Food Timeline
        </motion.h1>
        <p className="text-muted-foreground mt-1">Your meal history</p>
      </div>

      {/* Timeline */}
      <div className="px-6 space-y-8 flex-1">
        {sortedDates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center flex-1 min-h-[50vh]"
          >
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No meals logged yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start by logging your first meal</p>
          </motion.div>
        ) : (
          sortedDates.map((date, index) => {
            const dateMeals = mealsByDate[date];
            const totals = getDayTotals(dateMeals);
            return (
              <motion.div key={date} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">{formatDate(date)}</h2>
                    <p className="text-sm text-muted-foreground">
                      {totals.count} meal{totals.count !== 1 ? 's' : ''} • {totals.calories} cal
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {dateMeals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} onClick={() => setSelectedMeal(meal)} />
                  ))}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <MealDetail meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
    </div>
  );
}
