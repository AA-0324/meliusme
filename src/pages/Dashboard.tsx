import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useApp } from '@/contexts/AppContext';
import { ProBadge } from '@/components/ProBadge';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { PageTransition } from '@/components/PageTransition';
import { Meal } from '@/lib/db';
import { TrendingUp, Calendar, Flame, Lock, Beef, Apple, Candy, Settings2, Filter } from 'lucide-react';
import { ProgressRing } from '@/components/ProgressRing';
import { staggerContainer, fadeUp, fadeUpBounce, slideInLeft, slideInRight } from '@/lib/motion';
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

type DashboardFilter = 'today' | '7days' | '30days' | '90days' | 'custom';

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

  // Update streaks based on today's data
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = meals.filter(m => m.date === today);
    if (todayMeals.length > 0) {
      const totalCal = todayMeals.reduce((s, m) => s + m.calories, 0);
      const totalProt = todayMeals.reduce((s, m) => s + (m.protein || 0), 0);
      const metCalorie = settings.goals.calories ? (totalCal <= settings.goals.calories * 1.1 && totalCal >= settings.goals.calories * 0.8) : false;
      const metProtein = settings.goals.protein ? totalProt >= settings.goals.protein : false;
      updateStreaksData(today, true, metCalorie, metProtein).then(setStreaksData);
    }
  }, [meals, settings.goals]);

  const isWidgetVisible = (id: string) => {
    if (!isPro) return true; // Free users see fixed layout
    const widget = dashboardLayout.find(w => w.id === id);
    return widget ? widget.visible : true;
  };

  const getWidgetOrder = (id: string) => {
    if (!isPro) return 0;
    const widget = dashboardLayout.find(w => w.id === id);
    return widget ? widget.order : 0;
  };

  const filterDays = useMemo(() => {
    switch (dashboardFilter) {
      case 'today': return 1;
      case '7days': return 7;
      case '30days': return 30;
      case '90days': return 90;
      default: return 7;
    }
  }, [dashboardFilter]);

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

  const weeklyStats = useMemo(() => {
    const totalCalories = weekData.reduce((sum, d) => sum + d.calories, 0);
    const totalMeals = weekData.reduce((sum, d) => sum + d.meals.length, 0);
    const daysWithMeals = weekData.filter((d) => d.meals.length > 0).length;
    const avgCalories = daysWithMeals > 0 ? Math.round(totalCalories / daysWithMeals) : 0;

    return { totalCalories, totalMeals, avgCalories, daysWithMeals };
  }, [weekData]);

  const todayTotals = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayData = weekData.find(d => d.date === today);
    return {
      calories: todayData?.calories || 0,
      protein: todayData?.protein || 0,
      fiber: todayData?.fiber || 0,
      sugar: todayData?.sugar || 0,
    };
  }, [weekData]);

  const nutritionScore = useMemo(() => {
    return calculateNutritionScore(
      todayTotals.calories,
      todayTotals.protein,
      todayTotals.fiber,
      todayTotals.sugar,
      settings.goals
    );
  }, [todayTotals, settings.goals]);

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

  const filterOptions: { value: DashboardFilter; label: string; proOnly: boolean }[] = [
    { value: 'today', label: 'Today', proOnly: false },
    { value: '7days', label: '7 Days', proOnly: false },
    { value: '30days', label: '30 Days', proOnly: true },
    { value: '90days', label: '90 Days', proOnly: true },
    { value: 'custom', label: 'Custom', proOnly: true },
  ];

  // Build ordered widget list
  const widgetRenderers: Record<string, () => React.ReactNode> = {
    'stats': () => isWidgetVisible('stats') ? (
      <motion.div key="stats" variants={noMotion ? {} : fadeUpBounce} className="px-6 grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Avg/Day', value: weeklyStats.avgCalories, unit: 'cal' },
          { label: 'Total', value: weeklyStats.totalCalories, unit: 'cal' },
          { label: 'Meals', value: weeklyStats.totalMeals, unit: 'this week' },
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

    'goals': () => isWidgetVisible('goals') && (settings.goals.protein || settings.goals.fiber || settings.goals.sugar) ? (
      <motion.div key="goals" variants={noMotion ? {} : fadeUpBounce} className="px-6 mb-6">
        <div className={`bg-card rounded-3xl p-6 border border-border ${animationsEnabled ? 'animate-shine' : ''}`}>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Today's Goals</h2>
          <div className="grid grid-cols-3 gap-2">
            {settings.goals.protein && (
              <motion.div 
                className="flex flex-col items-center gap-1.5 min-w-0 overflow-hidden"
                initial={noMotion ? false : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', damping: 10 }}
              >
                <ProgressRing
                  progress={Math.min((todayTotals.protein / settings.goals.protein) * 100, 100)}
                  size={64}
                  strokeWidth={5}
                  showAnimation={todayTotals.protein >= settings.goals.protein}
                >
                  <Beef className="w-3.5 h-3.5 text-muted-foreground" />
                </ProgressRing>
                <div className="text-center">
                  <p className="text-sm font-bold leading-tight"><AnimatedNumber value={todayTotals.protein} suffix="g" /></p>
                  <p className="text-[10px] text-muted-foreground leading-tight">/ {settings.goals.protein}g protein</p>
                </div>
              </motion.div>
            )}
            {settings.goals.fiber && (
              <motion.div 
                className="flex flex-col items-center gap-1.5 min-w-0 overflow-hidden"
                initial={noMotion ? false : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: 'spring', damping: 10 }}
              >
                <ProgressRing
                  progress={Math.min((todayTotals.fiber / settings.goals.fiber) * 100, 100)}
                  size={64}
                  strokeWidth={5}
                  showAnimation={todayTotals.fiber >= settings.goals.fiber}
                >
                  <Apple className="w-3.5 h-3.5 text-muted-foreground" />
                </ProgressRing>
                <div className="text-center">
                  <p className="text-sm font-bold leading-tight"><AnimatedNumber value={todayTotals.fiber} suffix="g" /></p>
                  <p className="text-[10px] text-muted-foreground leading-tight">/ {settings.goals.fiber}g fiber</p>
                </div>
              </motion.div>
            )}
            {settings.goals.sugar && (
              <motion.div 
                className="flex flex-col items-center gap-1.5 min-w-0 overflow-hidden"
                initial={noMotion ? false : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring', damping: 10 }}
              >
                <ProgressRing
                  progress={Math.min((todayTotals.sugar / settings.goals.sugar) * 100, 100)}
                  size={64}
                  strokeWidth={5}
                  showAnimation={false}
                >
                  <Candy className="w-3.5 h-3.5 text-muted-foreground" />
                </ProgressRing>
                <div className="text-center">
                  <p className="text-sm font-bold leading-tight"><AnimatedNumber value={todayTotals.sugar} suffix="g" /></p>
                  <p className="text-[10px] text-muted-foreground leading-tight">/ {settings.goals.sugar}g sugar</p>
                </div>
              </motion.div>
            )}
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
            {!isPro && <ProBadge />}
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
              <p className="text-center text-muted-foreground py-8">No meals logged this week</p>
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
            <h2 className="text-lg font-semibold">Weekly Averages</h2>
            {!isPro && <ProBadge />}
          </div>
          {isPro ? (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Protein', value: Math.round(weekData.flatMap(d => d.meals).reduce((s, m) => s + (m.protein || 0), 0) / Math.max(weeklyStats.daysWithMeals, 1)), suffix: 'g' },
                { label: 'Fiber', value: Math.round(weekData.flatMap(d => d.meals).reduce((s, m) => s + (m.fiber || 0), 0) / Math.max(weeklyStats.daysWithMeals, 1)), suffix: 'g' },
                { label: 'Sugar', value: Math.round(weekData.flatMap(d => d.meals).reduce((s, m) => s + (m.sugar || 0), 0) / Math.max(weeklyStats.daysWithMeals, 1)), suffix: 'g' },
                { label: 'Meals', value: Math.round(weeklyStats.totalMeals / Math.max(weeklyStats.daysWithMeals, 1)), suffix: '' },
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
      <div className="px-6 pt-8 pb-4 safe-top">
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
              Weekly overview
            </motion.p>
          </div>
          {isPro && (
            <motion.button
              initial={noMotion ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowLayoutEditor(true)}
              className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <Settings2 className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="px-6 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterOptions.map((option) => {
            const isLocked = option.proOnly && !isPro;
            return (
              <button
                key={option.value}
                onClick={() => {
                  if (isLocked) {
                    setShowProModal(true);
                  } else {
                    setDashboardFilter(option.value);
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  dashboardFilter === option.value && !isLocked
                    ? 'bg-primary text-primary-foreground'
                    : isLocked
                      ? 'bg-secondary/30 text-muted-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >
                {option.label}
                {isLocked && <ProBadge showLock={false} className="scale-75" />}
              </button>
            );
          })}
        </div>
      </div>

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
