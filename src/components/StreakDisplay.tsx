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
      className="bg-gradient-to-br from-orange-500/10 via-red-500/10 to-amber-500/10 rounded-2xl p-5 border border-orange-500/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Current Streak</p>
            <p className="text-3xl font-extrabold text-orange-500">{streak.currentStreak} days</p>
          </div>
        </div>
        {streak.longestStreak > 0 && (
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase">Best</p>
            <p className="text-lg font-bold text-muted-foreground">{streak.longestStreak}</p>
          </div>
        )}
      </div>

      {/* Milestones */}
      <div className="flex gap-2 mt-3">
        {[7, 14, 30, 60, 100].map((milestone) => {
          const achieved = streak.currentStreak >= milestone || streak.longestStreak >= milestone;
          return (
            <div
              key={milestone}
              className={`flex-1 text-center py-2 rounded-lg transition-all ${
                achieved 
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md' 
                  : 'bg-secondary/50 text-muted-foreground'
              }`}
            >
              <Star className={`w-3 h-3 mx-auto mb-0.5 ${achieved ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-bold">{milestone}d</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
