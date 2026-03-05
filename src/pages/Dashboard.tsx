import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useApp } from '@/contexts/AppContext';
import { ProBadge } from '@/components/ProBadge';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { PageTransition } from '@/components/PageTransition';
import { Meal } from '@/lib/db';
import { TrendingUp, Calendar, Flame, Lock, Beef, Apple, Candy } from 'lucide-react';
import { ProgressRing } from '@/components/ProgressRing';
import { staggerContainer, fadeUp } from '@/lib/motion';

const MEAL_TYPE_COLORS = {
  breakfast: 'hsl(38, 92%, 50%)',
  lunch: 'hsl(142, 71%, 45%)',
  dinner: 'hsl(280, 65%, 60%)',
  snack: 'hsl(199, 89%, 48%)',
};

export default function Dashboard() {
  const { meals, settings, isPro } = useApp();
  const [showProModal, setShowProModal] = useState(false);

  // Get current week dates (Mon-Sun)
  const weekData = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const days: { date: string; day: string; calories: number; protein: number; fiber: number; sugar: number; meals: Meal[] }[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMeals = meals.filter((m) => m.date === dateStr);
      days.push({
        date: dateStr,
        day: dayNames[i],
        calories: dayMeals.reduce((sum, m) => sum + m.calories, 0),
        protein: dayMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
        fiber: dayMeals.reduce((sum, m) => sum + (m.fiber || 0), 0),
        sugar: dayMeals.reduce((sum, m) => sum + (m.sugar || 0), 0),
        meals: dayMeals,
      });
    }

    return days;
  }, [meals]);

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const totalCalories = weekData.reduce((sum, d) => sum + d.calories, 0);
    const totalMeals = weekData.reduce((sum, d) => sum + d.meals.length, 0);
    const daysWithMeals = weekData.filter((d) => d.meals.length > 0).length;
    const avgCalories = daysWithMeals > 0 ? Math.round(totalCalories / daysWithMeals) : 0;

    return { totalCalories, totalMeals, avgCalories, daysWithMeals };
  }, [weekData]);

  // Today's totals for goal rings
  const todayTotals = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayData = weekData.find(d => d.date === today);
    return {
      protein: todayData?.protein || 0,
      fiber: todayData?.fiber || 0,
      sugar: todayData?.sugar || 0,
    };
  }, [weekData]);

  // Meals by type (for pie chart)
  const mealsByType = useMemo(() => {
    const allWeekMeals = weekData.flatMap((d) => d.meals);
    const grouped = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    allWeekMeals.forEach((meal) => { grouped[meal.mealType] += meal.calories; });
    return Object.entries(grouped)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: MEAL_TYPE_COLORS[name as keyof typeof MEAL_TYPE_COLORS],
      }));
  }, [weekData]);

  const maxCalories = Math.max(...weekData.map((d) => d.calories), settings.goals.calories);

  return (
    <PageTransition className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 safe-top">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold">
          Dashboard
        </motion.h1>
        <p className="text-muted-foreground mt-1">Weekly overview</p>
      </div>

      <motion.div variants={staggerContainer(0.08)} initial="hidden" animate="show">
        {/* Weekly Stats */}
        <motion.div variants={fadeUp} className="px-6 grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Avg/Day', value: weeklyStats.avgCalories, unit: 'cal' },
            { label: 'Total', value: weeklyStats.totalCalories, unit: 'cal' },
            { label: 'Meals', value: weeklyStats.totalMeals, unit: 'this week' },
          ].map((stat) => (
            <motion.div key={stat.label} whileHover={{ y: -2 }} className="bg-card rounded-2xl p-4 border border-border card-interactive">
              <div className="text-muted-foreground text-xs mb-1">{stat.label}</div>
              <div className="text-xl font-bold"><AnimatedNumber value={stat.value} /></div>
              <div className="text-xs text-muted-foreground">{stat.unit}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Macro Goal Rings (Pro) */}
        {isPro && (settings.goals.protein || settings.goals.fiber || settings.goals.sugar) && (
          <motion.div variants={fadeUp} className="px-6 mb-6">
            <div className="bg-card rounded-3xl p-6 border border-border">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Today's Goals</h2>
              <div className="flex items-center justify-around">
                {settings.goals.protein && (
                  <div className="flex flex-col items-center gap-2">
                    <ProgressRing
                      progress={Math.min((todayTotals.protein / settings.goals.protein) * 100, 100)}
                      size={72}
                      strokeWidth={6}
                      showAnimation={todayTotals.protein >= settings.goals.protein}
                    >
                      <Beef className="w-4 h-4 text-muted-foreground" />
                    </ProgressRing>
                    <div className="text-center">
                      <p className="text-sm font-bold"><AnimatedNumber value={todayTotals.protein} suffix="g" /></p>
                      <p className="text-[10px] text-muted-foreground">/ {settings.goals.protein}g protein</p>
                    </div>
                  </div>
                )}
                {settings.goals.fiber && (
                  <div className="flex flex-col items-center gap-2">
                    <ProgressRing
                      progress={Math.min((todayTotals.fiber / settings.goals.fiber) * 100, 100)}
                      size={72}
                      strokeWidth={6}
                      showAnimation={todayTotals.fiber >= settings.goals.fiber}
                    >
                      <Apple className="w-4 h-4 text-muted-foreground" />
                    </ProgressRing>
                    <div className="text-center">
                      <p className="text-sm font-bold"><AnimatedNumber value={todayTotals.fiber} suffix="g" /></p>
                      <p className="text-[10px] text-muted-foreground">/ {settings.goals.fiber}g fiber</p>
                    </div>
                  </div>
                )}
                {settings.goals.sugar && (
                  <div className="flex flex-col items-center gap-2">
                    <ProgressRing
                      progress={Math.min((todayTotals.sugar / settings.goals.sugar) * 100, 100)}
                      size={72}
                      strokeWidth={6}
                      showAnimation={false}
                    >
                      <Candy className="w-4 h-4 text-muted-foreground" />
                    </ProgressRing>
                    <div className="text-center">
                      <p className="text-sm font-bold"><AnimatedNumber value={todayTotals.sugar} suffix="g" /></p>
                      <p className="text-[10px] text-muted-foreground">/ {settings.goals.sugar}g sugar</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Weekly Bar Chart */}
        <motion.div variants={fadeUp} className="px-6 mb-6">
          <div className="bg-card rounded-3xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">This Week</h2>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} domain={[0, maxCalories]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', padding: '8px 12px' }}
                    labelStyle={{ fontWeight: 'bold' }}
                    formatter={(value: number) => [`${value} cal`, 'Calories']}
                  />
                  <Bar dataKey="calories" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <div className="w-3 h-0.5 bg-primary" />
              <span>Daily goal: {settings.goals.calories} cal</span>
            </div>
          </div>
        </motion.div>

        {/* Calories by Meal Type */}
        <motion.div variants={fadeUp} className="px-6 mb-6">
          <div className="bg-card rounded-3xl p-6 border border-border relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">By Meal Type</h2>
              {!isPro && <ProBadge />}
            </div>
            {isPro ? (
              mealsByType.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-32 h-32 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={mealsByType} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={0} strokeWidth={0} dataKey="value" animationDuration={800} animationEasing="ease-out">
                          {mealsByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', padding: '8px 12px' }}
                          formatter={(value: number) => [`${value} cal`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2 w-full">
                    {mealsByType.map((entry) => (
                      <motion.div key={entry.name} whileHover={{ scale: 1.02 }} className="flex items-center gap-2 bg-secondary/30 rounded-lg p-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium truncate block">{entry.name}</span>
                          <span className="text-[10px] text-muted-foreground">{entry.value} cal</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No meals logged this week</p>
              )
            ) : (
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowProModal(true)} className="w-full h-32 flex flex-col items-center justify-center gap-3 bg-secondary/50 rounded-2xl hover:bg-secondary transition-colors">
                <Lock className="w-8 h-8 text-muted-foreground" />
                <span className="text-muted-foreground">Unlock with Pro</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Weekly Averages */}
        {isPro && (
          <motion.div variants={fadeUp} className="px-6 mb-6">
            <div className="bg-card rounded-3xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Weekly Averages</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Protein', value: Math.round(weekData.flatMap(d => d.meals).reduce((s, m) => s + (m.protein || 0), 0) / Math.max(weeklyStats.daysWithMeals, 1)), suffix: 'g' },
                  { label: 'Fiber', value: Math.round(weekData.flatMap(d => d.meals).reduce((s, m) => s + (m.fiber || 0), 0) / Math.max(weeklyStats.daysWithMeals, 1)), suffix: 'g' },
                  { label: 'Sugar', value: Math.round(weekData.flatMap(d => d.meals).reduce((s, m) => s + (m.sugar || 0), 0) / Math.max(weeklyStats.daysWithMeals, 1)), suffix: 'g' },
                  { label: 'Meals', value: Math.round(weeklyStats.totalMeals / Math.max(weeklyStats.daysWithMeals, 1)), suffix: '' },
                ].map((item) => (
                  <motion.div key={item.label} whileHover={{ y: -2 }} className="bg-secondary/50 rounded-xl p-4 card-interactive">
                    <div className="text-sm text-muted-foreground mb-1">{item.label}</div>
                    <div className="text-2xl font-bold"><AnimatedNumber value={item.value} suffix={item.suffix} /></div>
                    <div className="text-xs text-muted-foreground">per day</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      <ProUpgradeModal open={showProModal} onClose={() => setShowProModal(false)} />
    </PageTransition>
  );
}
