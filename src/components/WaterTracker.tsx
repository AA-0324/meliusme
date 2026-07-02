import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { useApp } from '@/contexts/AppContext';
import confetti from 'canvas-confetti';

interface WaterTrackerProps {
  glasses: number;
  goal: number;
  onIncrement: () => void;
}

const getConfettiKey = () => `melius-confetti-${new Date().toISOString().split('T')[0]}`;
const shownConfettiKeys = new Set<string>();

export function WaterTracker({ glasses, goal, onIncrement }: WaterTrackerProps) {
  const { animationsEnabled } = useApp();
  const progress = Math.min((glasses / goal) * 100, 100);
  const isComplete = glasses >= goal;
  const noMotion = !animationsEnabled;

  useEffect(() => {
    const confettiKey = getConfettiKey();
    const alreadyShown = shownConfettiKeys.has(confettiKey);
    if (isComplete && !alreadyShown) {
      shownConfettiKeys.add(confettiKey);
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#22d3ee', '#0ea5e9', '#3b82f6', '#06b6d4'] });
    }
  }, [isComplete]);

  return (
    <motion.div
      initial={noMotion ? false : { opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={noMotion ? {} : { y: -4, scale: 1.02 }}
      transition={{ type: 'spring', damping: 12, stiffness: 200 }}
      className={`bg-gradient-to-br from-[hsl(199,89%,40%)] to-[hsl(199,89%,30%)] rounded-2xl p-5 text-white shadow-lg shadow-[hsl(199,89%,40%)]/20 ${animationsEnabled ? 'animate-wave' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            whileTap={noMotion ? {} : { scale: 0.75, rotate: -20 }}
            animate={noMotion ? {} : { 
              rotate: [0, 10, -10, 0],
              y: [0, -3, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
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
        <motion.div 
          whileTap={noMotion ? {} : { scale: 0.7, rotate: -15 }}
          whileHover={noMotion ? {} : { scale: 1.15, rotate: 5 }}
          transition={{ type: 'spring', damping: 8, stiffness: 300 }}
        >
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
          transition={{ duration: 0.8, type: 'spring', damping: 15 }}
          className={`h-full rounded-full ${isComplete ? 'bg-white' : 'bg-white/80'}`}
        />
      </div>
      
      {isComplete && (
        <motion.p
          initial={noMotion ? false : { opacity: 0, y: 15, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 150 }}
          className="text-sm text-center mt-3 font-semibold"
        >
          Goal reached! Great job staying hydrated!
        </motion.p>
      )}
    </motion.div>
  );
}
