import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useApp } from '@/contexts/AppContext';
import { ProBadge } from '@/components/ProBadge';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { PageTransition } from '@/components/PageTransition';
import { Meal } from '@/lib/db';
import { TrendingUp, Calendar, Flame, Lock, Beef, Apple, Candy, Settings2 } from 'lucide-react';
import { ProgressRing } from '@/components/ProgressRing';
import { staggerContainer, fadeUpBounce } from '@/lib/motion';
import { TrendCharts } from '@/components/TrendCharts';
import { StreakTracker } from '@/components/StreakTracker';
import { NutritionScore } from '@/components/NutritionScore';
import { DashboardLayoutEditor } from '@/components/DashboardLayoutEditor';
import { calculateNutritionScore, getDashboardLayout, DashboardWidget, getStreaksData, StreaksData, updateStreaksData } from '@/lib/proFeatures';

const MEAL_TYPE_COLORS = {
  breakfast: 'hsl(38, 92%, 50%)',
  lunch: 'hsl(142, 71%, 45%)',
  dinner: 'hsl(280, 65%, 60%)',
  snack: 'hsl(199, 89%, 48%)',
};

type DashboardFilter = 'today' | '7days' | '30days' | '90days';

export default function Dashboard() {
  const { meals, settings, isPro, animationsEnabled } = useApp();
  const [showProModal, setShowProModal] = useState(false);
  const [showLayoutEditor, setShowLayoutEditor] = useState(false);
  const [dashboardFilter, setDashboardFilter] = useState<DashboardFilter>('7days');
  const [dashboardLayout, setDashboardLayout] = useState<DashboardWidget[]>([]);
  const [streaksData, setStreaksData] = useState<StreaksData>({ loggingStreak: 0, calorieTargetStreak: 0, proteinGoalStreak: 0, lastLoggingDate: null, lastCalorieDate: null, lastProteinDate: null });
  const noMotion = !animationsEnabled;

  useEffect(() => {
    getDashboardLayout().then(setDashboardLayout);
    getStreaksData().then(setStreaksData);
  }, []);

  // Update streaks based on today's data — single pass, runs only when today's data changes
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    let totalCal = 0, totalProt = 0, hasMeal = false;
    for (const m of meals) {
      if (m.date !== today) continue;
      hasMeal = true;
      totalCal += m.calories;
      totalProt += m.protein || 0;
    }
    if (!hasMeal) return;
    const calGoal = settings.goals.calories;
    const protGoal = settings.goals.protein;
    const metCalorie = calGoal ? (totalCal <= calGoal * 1.1 && totalCal >= calGoal * 0.8) : false;
    const metProtein = protGoal ? totalProt >= protGoal : false;
    updateStreaksData(today, true, metCalorie, metProtein).then(setStreaksData);
  }, [meals, settings.goals]);

  const isWidgetVisible = (id: string) => {
    if (!isPro) return true;
    const widget = dashboardLayout.find(w => w.id === id);
    return widget ? widget.visible : true;
  };

  // Compute the number of days for the active filter
  const filterDays = useMemo(() => {
    switch (dashboardFilter) {
      case 'today': return 1;
      case '7days': return 7;
      case '30days': return 30;
      case '90days': return 90;
      default: return 7;
    }
  }, [dashboardFilter]);

  // Filtered meals based on the selected time range
  const filteredMeals = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (filterDays - 1));
    const startStr = startDate.toISOString().split('T')[0];
    return meals.filter(m => m.date >= startStr);
  }, [meals, filterDays]);

  // Build day-by-day data for the active range
  const rangeData = useMemo(() => {
    const today = new Date();
    const days: { date: string; day: string; calories: number; protein: number; fiber: number; sugar: number; meals: Meal[] }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = filterDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMeals = meals.filter((m) => m.date === dateStr);
      days.push({
        date: dateStr,
        day: filterDays <= 7 ? dayNames[date.getDay()] : `${date.getMonth() + 1}/${date.getDate()}`,
        calories: dayMeals.reduce((sum, m) => sum + m.calories, 0),
        protein: dayMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
        fiber: dayMeals.reduce((sum, m) => sum + (m.fiber || 0), 0),
        sugar: dayMeals.reduce((sum, m) => sum + (m.sugar || 0), 0),
        meals: dayMeals,
      });
    }
    return days;
  }, [meals, filterDays]);

  const rangeStats = useMemo(() => {
    const totalCalories = rangeData.reduce((sum, d) => sum + d.calories, 0);
    const totalMeals = rangeData.reduce((sum, d) => sum + d.meals.length, 0);
    const daysWithMeals = rangeData.filter((d) => d.meals.length > 0).length;
    const avgCalories = daysWithMeals > 0 ? Math.round(totalCalories / daysWithMeals) : 0;
    return { totalCalories, totalMeals, avgCalories, daysWithMeals };
  }, [rangeData]);

  const todayTotals = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayData = rangeData.find(d => d.date === today);
    return {
      calories: todayData?.calories || 0,
      protein: todayData?.protein || 0,
      fiber: todayData?.fiber || 0,
      sugar: todayData?.sugar || 0,
    };
  }, [rangeData]);

  const hasMealsToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return meals.some(m => m.date === today);
  }, [meals]);

  const nutritionScore = useMemo(() => {
    return calculateNutritionScore(
      todayTotals.calories,
      todayTotals.protein,
      todayTotals.fiber,
      todayTotals.sugar,
      settings.goals,
      hasMealsToday
    );
  }, [todayTotals, settings.goals, hasMealsToday]);

  const mealsByType = useMemo(() => {
    const allMeals = filteredMeals;
    const grouped = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    allMeals.forEach((meal) => { grouped[meal.mealType] += meal.calories; });
    return Object.entries(grouped)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: MEAL_TYPE_COLORS[name as keyof typeof MEAL_TYPE_COLORS],
      }));
  }, [filteredMeals]);

  const maxCalories = Math.max(...rangeData.map((d) => d.calories), settings.goals.calories);

  const filterLabel = useMemo(() => {
    switch (dashboardFilter) {
      case 'today': return "Today's overview";
      case '7days': return 'Weekly overview';
      case '30days': return '30-day overview';
      case '90days': return '90-day overview';
      default: return 'Overview';
    }
  }, [dashboardFilter]);

  const filterOptions: { value: DashboardFilter; label: string; proOnly: boolean }[] = [
    { value: 'today', label: 'Today', proOnly: false },
    { value: '7days', label: '7 Days', proOnly: false },
    { value: '30days', label: '30 Days', proOnly: true },
    { value: '90days', label: '90 Days', proOnly: true },
  ];

  // Chart data — for longer ranges, aggregate to avoid overcrowding
  const chartData = useMemo(() => {
    if (filterDays <= 7) return rangeData;
    // For 30/90 days, show weekly averages
    const weeks: typeof rangeData = [];
    const chunkSize = 7;
    for (let i = 0; i < rangeData.length; i += chunkSize) {
      const chunk = rangeData.slice(i, i + chunkSize);
      const daysWithMeals = chunk.filter(d => d.meals.length > 0).length;
      weeks.push({
        date: chunk[0].date,
        day: chunk[0].day,
        calories: daysWithMeals > 0 ? Math.round(chunk.reduce((s, d) => s + d.calories, 0) / daysWithMeals) : 0,
        protein: daysWithMeals > 0 ? Math.round(chunk.reduce((s, d) => s + d.protein, 0) / daysWithMeals) : 0,
        fiber: daysWithMeals > 0 ? Math.round(chunk.reduce((s, d) => s + d.fiber, 0) / daysWithMeals) : 0,
        sugar: daysWithMeals > 0 ? Math.round(chunk.reduce((s, d) => s + d.sugar, 0) / daysWithMeals) : 0,
        meals: chunk.flatMap(d => d.meals),
      });
    }
    return weeks;
  }, [rangeData, filterDays]);

  // Build ordered widget list
  const widgetRenderers: Record<string, () => React.ReactNode> = {
    'stats': () => isWidgetVisible('stats') ? (
      <motion.div key="stats" variants={noMotion ? {} : fadeUpBounce} className="px-6 grid grid-cols-3 gap-3 mb-6">
        {[
          { label: dashboardFilter === 'today' ? 'Today' : 'Avg/Day', value: dashboardFilter === 'today' ? rangeStats.totalCalories : rangeStats.avgCalories, unit: 'cal' },
          { label: 'Total', value: rangeStats.totalCalories, unit: 'cal' },
          { label: 'Meals', value: rangeStats.totalMeals, unit: filterDays === 1 ? 'today' : `in ${filterDays}d` },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label} 
            whileHover={noMotion ? {} : { y: -5, scale: 1.05 }}
            whileTap={noMotion ? {} : { scale: 0.95 }}
            initial={noMotion ? false : { opacity: 0, y: 30, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.1, type: 'spring', damping: 12, stiffness: 150 }}
            className={`bg-card rounded-2xl p-4 border border-border card-interactive ${animationsEnabled ? 'animate-shine' : ''}`}
          >
            <div className="text-muted-foreground text-xs mb-1">{stat.label}</div>
            <div className="text-xl font-bold"><AnimatedNumber value={stat.value} /></div>
            <div className="text-xs text-muted-foreground">{stat.unit}</div>
          </motion.div>
        ))}
      </motion.div>
    ) : null,

    'goals': () => isWidgetVisible('goals') && ((settings.goals.protein ?? 50) || (settings.goals.fiber ?? 25) || (settings.goals.sugar ?? 50)) ? (
      <motion.div key="goals" variants={noMotion ? {} : fadeUpBounce} className="px-6 mb-6">
        <div className={`bg-card rounded-3xl p-6 border border-border ${animationsEnabled ? 'animate-shine' : ''}`}>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Today's Goals</h2>
          <div className="grid grid-cols-3 gap-2">
            {(() => { const goal = settings.goals.protein ?? 50; return (
              <motion.div 
                className="flex flex-col items-center gap-1.5 min-w-0 overflow-hidden"
                initial={noMotion ? false : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', damping: 10 }}
              >
                <ProgressRing
                  progress={Math.min((todayTotals.protein / goal) * 100, 100)}
                  size={64}
                  strokeWidth={5}
                  showAnimation={todayTotals.protein >= goal}
                >
                  <Beef className="w-3.5 h-3.5 text-muted-foreground" />
                </ProgressRing>
                <div className="text-center">
                  <p className="text-sm font-bold leading-tight"><AnimatedNumber value={todayTotals.protein} suffix="g" /></p>
                  <p className="text-[10px] text-muted-foreground leading-tight">/ {goal}g protein</p>
                </div>
              </motion.div>
            ); })()}
            {(() => { const goal = settings.goals.fiber ?? 25; return (
              <motion.div 
                className="flex flex-col items-center gap-1.5 min-w-0 overflow-hidden"
                initial={noMotion ? false : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: 'spring', damping: 10 }}
              >
                <ProgressRing
                  progress={Math.min((todayTotals.fiber / goal) * 100, 100)}
                  size={64}
                  strokeWidth={5}
                  showAnimation={todayTotals.fiber >= goal}
                >
                  <Apple className="w-3.5 h-3.5 text-muted-foreground" />
                </ProgressRing>
                <div className="text-center">
                  <p className="text-sm font-bold leading-tight"><AnimatedNumber value={todayTotals.fiber} suffix="g" /></p>
                  <p className="text-[10px] text-muted-foreground leading-tight">/ {goal}g fiber</p>
                </div>
              </motion.div>
            ); })()}
            {(() => { const goal = settings.goals.sugar ?? 50; return (
              <motion.div 
                className="flex flex-col items-center gap-1.5 min-w-0 overflow-hidden"
                initial={noMotion ? false : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring', damping: 10 }}
              >
                <ProgressRing
                  progress={Math.min((todayTotals.sugar / goal) * 100, 100)}
                  size={64}
                  strokeWidth={5}
                  showAnimation={false}
                >
                  <Candy className="w-3.5 h-3.5 text-muted-foreground" />
                </ProgressRing>
                <div className="text-center">
                  <p className="text-sm font-bold leading-tight"><AnimatedNumber value={todayTotals.sugar} suffix="g" /></p>
                  <p className="text-[10px] text-muted-foreground leading-tight">/ {goal}g sugar</p>
                </div>
              </motion.div>
            ); })()}
          </div>
        </div>
      </motion.div>
    ) : null,

    'weekly-chart': () => isWidgetVisible('weekly-chart') ? (
      <motion.div key="weekly-chart" variants={noMotion ? {} : fadeUpBounce} className="px-6 mb-6">
        <div className={`bg-card rounded-3xl p-6 border border-border ${animationsEnabled ? 'animate-shine' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            <motion.div
              animate={noMotion ? {} : { rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Calendar className="w-5 h-5 text-primary" />
            </motion.div>
            <h2 className="text-lg font-semibold">
              {filterDays <= 7 ? 'This Week' : filterDays <= 30 ? 'Last 30 Days' : 'Last 90 Days'}
            </h2>
            {filterDays > 7 && <span className="text-xs text-muted-foreground">(weekly avg)</span>}
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} domain={[0, maxCalories]} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', padding: '8px 12px' }}
                  labelStyle={{ fontWeight: 'bold' }}
                  formatter={(value: number) => [`${value} cal`, filterDays > 7 ? 'Avg Calories' : 'Calories']}
                />
                <Bar dataKey="calories" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} animationDuration={1200} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <div className="w-3 h-0.5 bg-primary" />
            <span>Daily goal: {settings.goals.calories} cal</span>
          </div>
        </div>
      </motion.div>
    ) : null,

    'meal-type': () => isWidgetVisible('meal-type') ? (
      <motion.div key="meal-type" variants={noMotion ? {} : fadeUpBounce} className="px-6 mb-6">
        <div className={`bg-card rounded-3xl p-6 border border-border relative overflow-hidden ${animationsEnabled ? 'animate-shine' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            <motion.div
              animate={noMotion ? {} : { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <Flame className="w-5 h-5 text-primary" />
            </motion.div>
            <h2 className="text-lg font-semibold">By Meal Type</h2>
          </div>
          {isPro ? (
            mealsByType.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <motion.div 
                  className="w-32 h-32 flex-shrink-0"
                  initial={noMotion ? false : { scale: 0.5, rotate: -90, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring', damping: 12 }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={mealsByType} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={0} strokeWidth={0} dataKey="value" animationDuration={1200} animationEasing="ease-out">
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
                </motion.div>
                <div className="flex-1 grid grid-cols-2 gap-2 w-full">
                  {mealsByType.map((entry, i) => (
                    <motion.div 
                      key={entry.name} 
                      whileHover={noMotion ? {} : { scale: 1.05, y: -2 }}
                      initial={noMotion ? false : { opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.08, type: 'spring', damping: 12 }}
                      className="flex items-center gap-2 bg-secondary/30 rounded-lg p-2"
                    >
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
              <p className="text-center text-muted-foreground py-8">No meals logged in this period</p>
            )
          ) : (
            <motion.button 
              whileTap={noMotion ? {} : { scale: 0.95 }}
              whileHover={noMotion ? {} : { scale: 1.03 }}
              onClick={() => setShowProModal(true)} 
              className="w-full h-32 flex flex-col items-center justify-center gap-3 bg-secondary/50 rounded-2xl hover:bg-secondary transition-colors"
            >
              <motion.div
                animate={noMotion ? {} : { y: [0, -5, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Lock className="w-8 h-8 text-muted-foreground" />
              </motion.div>
              <span className="text-muted-foreground">Unlock with Pro</span>
            </motion.button>
          )}
        </div>
      </motion.div>
    ) : null,

    'averages': () => isWidgetVisible('averages') ? (
      <motion.div key="averages" variants={noMotion ? {} : fadeUpBounce} className="px-6 mb-6">
        <div className={`bg-card rounded-3xl p-6 border border-border relative overflow-hidden ${animationsEnabled ? 'animate-shine' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            <motion.div
              animate={noMotion ? {} : { y: [0, -4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <TrendingUp className="w-5 h-5 text-primary" />
            </motion.div>
            <h2 className="text-lg font-semibold">
              {filterDays <= 7 ? 'Weekly' : `${filterDays}-Day`} Averages
            </h2>
          </div>
          {isPro ? (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Protein', value: Math.round(filteredMeals.reduce((s, m) => s + (m.protein || 0), 0) / Math.max(rangeStats.daysWithMeals, 1)), suffix: 'g' },
                { label: 'Fiber', value: Math.round(filteredMeals.reduce((s, m) => s + (m.fiber || 0), 0) / Math.max(rangeStats.daysWithMeals, 1)), suffix: 'g' },
                { label: 'Sugar', value: Math.round(filteredMeals.reduce((s, m) => s + (m.sugar || 0), 0) / Math.max(rangeStats.daysWithMeals, 1)), suffix: 'g' },
                { label: 'Meals', value: Math.round(rangeStats.totalMeals / Math.max(rangeStats.daysWithMeals, 1)), suffix: '' },
              ].map((item, i) => (
                <motion.div 
                  key={item.label} 
                  whileHover={noMotion ? {} : { y: -4, scale: 1.03 }}
                  initial={noMotion ? false : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.08, type: 'spring', damping: 12 }}
                  className="bg-secondary/50 rounded-xl p-4 card-interactive"
                >
                  <div className="text-sm text-muted-foreground mb-1">{item.label}</div>
                  <div className="text-2xl font-bold"><AnimatedNumber value={item.value} suffix={item.suffix} /></div>
                  <div className="text-xs text-muted-foreground">per day</div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.button 
              whileTap={noMotion ? {} : { scale: 0.95 }}
              whileHover={noMotion ? {} : { scale: 1.03 }}
              onClick={() => setShowProModal(true)} 
              className="w-full h-32 flex flex-col items-center justify-center gap-3 bg-secondary/50 rounded-2xl hover:bg-secondary transition-colors"
            >
              <motion.div
                animate={noMotion ? {} : { y: [0, -5, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Lock className="w-8 h-8 text-muted-foreground" />
              </motion.div>
              <span className="text-muted-foreground">Unlock with Pro</span>
            </motion.button>
          )}
        </div>
      </motion.div>
    ) : null,

    'streaks': () => isWidgetVisible('streaks') ? (
      <StreakTracker
        key="streaks"
        loggingStreak={streaksData.loggingStreak}
        calorieTargetStreak={streaksData.calorieTargetStreak}
        proteinGoalStreak={streaksData.proteinGoalStreak}
        isPro={isPro}
        onUpgradeClick={() => setShowProModal(true)}
        animationsEnabled={animationsEnabled}
      />
    ) : null,

    'nutrition-score': () => isWidgetVisible('nutrition-score') ? (
      <NutritionScore
        key="nutrition-score"
        score={nutritionScore}
        hasMealsToday={hasMealsToday}
        isPro={isPro}
        onUpgradeClick={() => setShowProModal(true)}
        animationsEnabled={animationsEnabled}
      />
    ) : null,

    'trends': () => isWidgetVisible('trends') ? (
      <TrendCharts
        key="trends"
        meals={meals}
        goals={settings.goals}
        isPro={isPro}
        onUpgradeClick={() => setShowProModal(true)}
        animationsEnabled={animationsEnabled}
      />
    ) : null,
  };

  // Order widgets based on layout for Pro users
  const orderedWidgetIds = isPro
    ? dashboardLayout.sort((a, b) => a.order - b.order).map(w => w.id)
    : ['stats', 'goals', 'weekly-chart', 'meal-type', 'averages', 'streaks', 'nutrition-score', 'trends'];

  return (
    <PageTransition className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-10 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <motion.h1 
              initial={noMotion ? false : { opacity: 0, y: -30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 150 }}
              className="text-3xl font-bold"
            >
              Dashboard
            </motion.h1>
            <motion.p 
              initial={noMotion ? false : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, type: 'spring', damping: 15 }}
              className="text-muted-foreground mt-1"
            >
              {filterLabel}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Filters row - Pro only */}
      {isPro && (
        <div className="px-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDashboardFilter(option.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    dashboardFilter === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <motion.button
              initial={noMotion ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowLayoutEditor(true)}
              className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors flex-shrink-0"
              title="Customize layout"
            >
              <Settings2 className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>
        </div>
      )}

      <motion.div variants={staggerContainer(0.12)} initial={noMotion ? false : "hidden"} animate="show">
        {orderedWidgetIds.map(id => {
          const renderer = widgetRenderers[id];
          return renderer ? renderer() : null;
        })}
      </motion.div>

      <ProUpgradeModal open={showProModal} onClose={() => setShowProModal(false)} />
      <DashboardLayoutEditor
        open={showLayoutEditor}
        onClose={() => setShowLayoutEditor(false)}
        onSave={setDashboardLayout}
      />
    </PageTransition>
  );
}
