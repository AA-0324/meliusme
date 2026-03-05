import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import confetti from 'canvas-confetti';

interface WaterTrackerProps {
  glasses: number;
  goal: number;
  onIncrement: () => void;
}

const getConfettiKey = () => `melius-confetti-${new Date().toISOString().split('T')[0]}`;

export function WaterTracker({ glasses, goal, onIncrement }: WaterTrackerProps) {
  const progress = Math.min((glasses / goal) * 100, 100);
  const isComplete = glasses >= goal;

  useEffect(() => {
    const confettiKey = getConfettiKey();
    const alreadyShown = sessionStorage.getItem(confettiKey) === 'true';
    if (isComplete && !alreadyShown) {
      sessionStorage.setItem(confettiKey, 'true');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#22d3ee', '#0ea5e9', '#3b82f6', '#06b6d4'] });
    }
  }, [isComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="bg-gradient-to-br from-[hsl(199,89%,40%)] to-[hsl(199,89%,30%)] rounded-2xl p-5 text-white shadow-lg shadow-[hsl(199,89%,40%)]/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            whileTap={{ scale: 0.9, rotate: -10 }}
            className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm"
          >
            <Droplets className="w-6 h-6" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-sm opacity-80 uppercase tracking-wide">Water</h3>
            <p className="text-3xl font-bold">
              <AnimatedNumber value={glasses} /> <span className="text-lg font-medium opacity-70">/ {goal}</span>
            </p>
          </div>
        </div>
        <motion.div whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.05 }} transition={{ type: 'spring', damping: 15, stiffness: 300 }}>
          <Button
            size="icon"
            variant="ghost"
            onClick={onIncrement}
            disabled={isComplete}
            className="w-12 h-12 rounded-xl bg-white/20 hover:bg-white/30 text-white disabled:opacity-30 disabled:hover:bg-white/20"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </motion.div>
      </div>

      <div className="h-2.5 bg-white/15 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full ${isComplete ? 'bg-white' : 'bg-white/80'}`}
        />
      </div>
      
      {isComplete && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          className="text-sm text-center mt-3 font-semibold"
        >
          Goal reached! Great job staying hydrated!
        </motion.p>
      )}
    </motion.div>
  );
}
