import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
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

  const hasData = trendData.some(d => d.calories > 0);

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
          <div className="flex gap-1.5">
            {(['30', '90'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >
                {range}d
              </button>
            ))}
          </div>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <TrendingUp className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No data for this period</p>
          </div>
        ) : (
          <>
            {/* Main calories chart */}
            <div className="h-52 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    interval={timeRange === '30' ? 6 : 14}
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
                    formatter={(value: number) => [`${value} cal`, 'Calories']}
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

            {/* Macro mini charts */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'protein', label: 'Protein', unit: 'g', color: 'hsl(142, 71%, 45%)' },
                { key: 'fiber', label: 'Fiber', unit: 'g', color: 'hsl(280, 65%, 60%)' },
                { key: 'sugar', label: 'Sugar', unit: 'g', color: 'hsl(199, 89%, 48%)' },
              ].map((nutrient) => (
                <div key={nutrient.key}>
                  <p className="text-xs text-center text-muted-foreground mb-1 font-medium">{nutrient.label}</p>
                  <div className="h-24 bg-secondary/20 rounded-xl p-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
                          width={32}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            padding: '4px 8px',
                            fontSize: '11px',
                          }}
                          formatter={(value: number) => [`${value}${nutrient.unit}`, nutrient.label]}
                          labelFormatter={() => ''}
                        />
                        <Line
                          type="monotone"
                          dataKey={nutrient.key}
                          stroke={nutrient.color}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
