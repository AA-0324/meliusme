import { motion } from 'framer-motion';
import { Flame, Trophy, Star } from 'lucide-react';
import { StreakData, Badge as BadgeType } from '@/lib/streaks';

interface StreakDisplayProps {
  streak: StreakData;
  compact?: boolean;
}

export function StreakDisplay({ streak, compact }: StreakDisplayProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30">
        <Flame className="w-5 h-5 text-orange-500" />
        <span className="text-lg font-bold text-orange-500">{streak.currentStreak}</span>
        <span className="text-xs text-muted-foreground">day streak</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border border-border/50"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Streak</p>
          <p className="text-2xl font-extrabold text-primary leading-tight">
            {streak.currentStreak} day{streak.currentStreak === 1 ? '' : 's'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Best</p>
          <p className="text-sm font-bold text-muted-foreground">{streak.longestStreak}</p>
        </div>
      </div>
    </motion.div>
  );
}
