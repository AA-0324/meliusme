import { motion } from 'framer-motion';
import { Droplets, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WaterTrackerProps {
  glasses: number;
  goal: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function WaterTracker({ glasses, goal, onIncrement, onDecrement }: WaterTrackerProps) {
  const progress = Math.min((glasses / goal) * 100, 100);
  const isComplete = glasses >= goal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[hsl(199,89%,48%)] to-[hsl(199,89%,40%)] rounded-3xl p-5 text-white shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm opacity-90">Water Intake</h3>
            <p className="text-2xl font-bold">
              {glasses} <span className="text-base font-medium opacity-80">/ {goal} glasses</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={onDecrement}
            disabled={glasses <= 0}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
          >
            <Minus className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onIncrement}
            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${isComplete ? 'bg-white' : 'bg-white/80'}`}
        />
      </div>
      
      {isComplete && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-center mt-2 font-medium"
        >
          🎉 Goal reached!
        </motion.p>
      )}
    </motion.div>
  );
}
