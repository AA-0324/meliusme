import { motion } from 'framer-motion';
import { Award, Lock } from 'lucide-react';
import { fadeUpBounce } from '@/lib/motion';
import { ProgressRing } from './ProgressRing';

interface NutritionScoreProps {
  score: number;
  isPro: boolean;
  onUpgradeClick: () => void;
  animationsEnabled: boolean;
}

export function NutritionScore({ score, isPro, onUpgradeClick, animationsEnabled }: NutritionScoreProps) {
  const noMotion = !animationsEnabled;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Work';
  };

  if (!isPro) {
    return (
      <motion.div variants={noMotion ? {} : fadeUpBounce} className="px-6 mb-6">
        <div className={`bg-card rounded-3xl p-6 border border-border ${animationsEnabled ? 'animate-shine' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Nutrition Score</h2>
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

  return (
    <motion.div variants={noMotion ? {} : fadeUpBounce} className="px-6 mb-6">
      <div className={`bg-card rounded-3xl p-6 border border-border ${animationsEnabled ? 'animate-shine' : ''}`}>
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Today's Nutrition Score</h2>
        </div>
        <div className="flex items-center gap-6">
          <motion.div
            initial={noMotion ? false : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 10 }}
          >
            <ProgressRing progress={score} size={100} strokeWidth={8} showAnimation={score >= 80}>
              <Award className="w-6 h-6 text-primary" />
            </ProgressRing>
          </motion.div>
          <div className="flex-1">
            <div className={`text-5xl font-bold ${getScoreColor(score)}`}>{score}</div>
            <div className="text-muted-foreground text-sm">out of 100</div>
            <div className={`text-lg font-semibold mt-1 ${getScoreColor(score)}`}>
              {getScoreLabel(score)}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
          <div className="text-center">
            <div className="font-semibold">Calories</div>
            <div>40%</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Protein</div>
            <div>25%</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Fiber</div>
            <div>20%</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Sugar</div>
            <div>15%</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
