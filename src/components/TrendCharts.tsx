import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Meal, Goals } from '@/lib/db';
import { TrendingUp, Lock } from 'lucide-react';
import { fadeUpBounce } from '@/lib/motion';
import { format } from 'date-fns';

interface TrendChartsProps {
  meals: Meal[];
  goals: Goals;
  isPro: boolean;
  onUpgradeClick: () => void;
  animationsEnabled: boolean;
}

type TimeRange = '30' | '90';

export function TrendCharts({ meals, goals, isPro, onUpgradeClick, animationsEnabled }: TrendChartsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  const noMotion = !animationsEnabled;

  const trendData = useMemo(() => {
    const days = timeRange === '30' ? 30 : 90;
    const today = new Date();
    const data: { date: string; label: string; calories: number; protein: number; fiber: number; sugar: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMeals = meals.filter(m => m.date === dateStr);

      data.push({
        date: dateStr,
        label: format(date, 'MMM d'),
        calories: dayMeals.reduce((sum, m) => sum + m.calories, 0),
        protein: dayMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
        fiber: dayMeals.reduce((sum, m) => sum + (m.fiber || 0), 0),
        sugar: dayMeals.reduce((sum, m) => sum + (m.sugar || 0), 0),
      });
    }

    return data;
  }, [meals, timeRange]);

  if (!isPro) {
    return (
      <motion.div variants={noMotion ? {} : fadeUpBounce} className="px-6 mb-6">
        <div className={`bg-card rounded-3xl p-6 border border-border relative overflow-hidden ${animationsEnabled ? 'animate-shine' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Long-term Trends</h2>
          </div>
          <motion.button
            whileTap={noMotion ? {} : { scale: 0.95 }}
            whileHover={noMotion ? {} : { scale: 1.03 }}
            onClick={onUpgradeClick}
            className="w-full h-48 flex flex-col items-center justify-center gap-3 bg-secondary/50 rounded-2xl hover:bg-secondary transition-colors"
          >
            <motion.div
              animate={noMotion ? {} : { y: [0, -5, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Lock className="w-8 h-8 text-muted-foreground" />
            </motion.div>
            <span className="text-muted-foreground">Unlock with Pro</span>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={noMotion ? {} : fadeUpBounce} className="px-6 mb-6">
      <div className={`bg-card rounded-3xl p-6 border border-border ${animationsEnabled ? 'animate-shine' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Long-term Trends</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('30')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === '30'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange('90')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === '90'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              90 Days
            </button>
          </div>
        </div>

        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                interval={timeRange === '30' ? 4 : 14}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  padding: '8px 12px',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Calories"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'protein', label: 'Protein (g)', color: 'hsl(142, 71%, 45%)' },
            { key: 'fiber', label: 'Fiber (g)', color: 'hsl(280, 65%, 60%)' },
            { key: 'sugar', label: 'Sugar (g)', color: 'hsl(199, 89%, 48%)' },
          ].map((nutrient) => (
            <div key={nutrient.key} className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '11px',
                    }}
                    formatter={(value: number) => [value, nutrient.label]}
                  />
                  <Line
                    type="monotone"
                    dataKey={nutrient.key}
                    stroke={nutrient.color}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-center text-muted-foreground mt-1">{nutrient.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
