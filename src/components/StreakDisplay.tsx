import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { StreakData } from '@/lib/streaks';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { useApp } from '@/contexts/AppContext';

interface StreakDisplayProps {
  streak: StreakData;
  compact?: boolean;
}

export function StreakDisplay({ streak, compact }: StreakDisplayProps) {
  const { animationsEnabled } = useApp();
  const streakColor = streak.currentStreak > 0 
    ? 'text-orange-500' 
    : 'text-muted-foreground';
  const streakBg = streak.currentStreak > 0
    ? 'from-orange-500/20 to-orange-500/10 border-orange-500/30'
    : 'from-muted/20 to-muted/10 border-muted/30';

  const hasActiveStreak = streak.currentStreak > 0;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r ${streakBg} rounded-xl border`}>
        <Flame className={`w-5 h-5 ${streakColor}`} />
        <span className={`text-lg font-bold ${streakColor}`}><AnimatedNumber value={streak.currentStreak} /></span>
        <span className="text-xs text-muted-foreground">day streak</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="bg-card rounded-2xl p-4 border border-border/50 card-interactive"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex items-center gap-3">
          <motion.div
            animate={
              hasActiveStreak && animationsEnabled
                ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0],
                  }
                : {}
            }
            transition={
              hasActiveStreak && animationsEnabled
                ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                : {}
            }
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasActiveStreak ? 'bg-orange-500/20' : 'bg-muted/20'}`}
          >
            <Flame className={`w-5 h-5 ${streakColor}`} />
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Streak</p>
            <p className={`text-2xl font-extrabold leading-tight ${streakColor}`}>
              <AnimatedNumber value={streak.currentStreak} /> day{streak.currentStreak === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Best</p>
          <p className="text-sm font-bold text-muted-foreground"><AnimatedNumber value={streak.longestStreak} /></p>
        </div>
      </div>
    </motion.div>
  );
}
