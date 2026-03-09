import { motion } from 'framer-motion';
import { Flame, Target, TrendingUp, Lock } from 'lucide-react';
import { fadeUpBounce } from '@/lib/motion';

interface StreakTrackerProps {
  loggingStreak: number;
  calorieTargetStreak: number;
  proteinGoalStreak: number;
  isPro: boolean;
  onUpgradeClick: () => void;
  animationsEnabled: boolean;
}

export function StreakTracker({
  loggingStreak,
  calorieTargetStreak,
  proteinGoalStreak,
  isPro,
  onUpgradeClick,
  animationsEnabled,
}: StreakTrackerProps) {
  const noMotion = !animationsEnabled;

  if (!isPro) {
    return (
      <motion.div variants={noMotion ? {} : fadeUpBounce} className="px-6 mb-6">
        <div className={`bg-card rounded-3xl p-6 border border-border ${animationsEnabled ? 'animate-shine' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Streaks</h2>
          </div>
          <motion.button
            whileTap={noMotion ? {} : { scale: 0.95 }}
            whileHover={noMotion ? {} : { scale: 1.03 }}
            onClick={onUpgradeClick}
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
        </div>
      </motion.div>
    );
  }

  const streaks = [
    { icon: Flame, label: 'Logging Streak', value: loggingStreak, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { icon: Target, label: 'Calorie Target', value: calorieTargetStreak, color: 'text-green-500', bg: 'bg-green-500/10' },
    { icon: TrendingUp, label: 'Protein Goal', value: proteinGoalStreak, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  return (
    <motion.div variants={noMotion ? {} : fadeUpBounce} className="px-6 mb-6">
      <div className={`bg-card rounded-3xl p-6 border border-border ${animationsEnabled ? 'animate-shine' : ''}`}>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Streaks</h2>
        </div>
        <div className="grid gap-3">
          {streaks.map((streak, i) => (
            <motion.div
              key={streak.label}
              initial={noMotion ? false : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1, type: 'spring', damping: 12 }}
              className="flex items-center justify-between bg-secondary/30 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${streak.bg} flex items-center justify-center`}>
                  <streak.icon className={`w-4.5 h-4.5 ${streak.color}`} />
                </div>
                <span className="font-medium text-sm">{streak.label}</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{streak.value}</div>
                <div className="text-xs text-muted-foreground">{streak.value === 1 ? 'day' : 'days'}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
