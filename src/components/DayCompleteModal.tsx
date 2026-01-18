import { motion, AnimatePresence } from 'framer-motion';
import { Check, Utensils, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DayCompleteModalProps {
  open: boolean;
  onClose: () => void;
  totalCalories: number;
  totalMeals: number;
}

export function DayCompleteModal({ open, onClose, totalCalories, totalMeals }: DayCompleteModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm text-center"
          >
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 12 }}
              className="w-24 h-24 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', damping: 12 }}
                className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-glow"
              >
                <Check className="w-10 h-10 text-primary-foreground" />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold mb-2"
            >
              Day Complete
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-8"
            >
              Today logged. Great job! 🎉
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-4 mb-8"
            >
              <div className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-center justify-center gap-2 text-primary mb-2">
                  <Flame className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold">{totalCalories}</p>
                <p className="text-xs text-muted-foreground">Total Calories</p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-center justify-center gap-2 text-primary mb-2">
                  <Utensils className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold">{totalMeals}</p>
                <p className="text-xs text-muted-foreground">Meals Logged</p>
              </div>
            </motion.div>

            {/* Close button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={onClose}
                className="w-full h-14 text-lg rounded-xl font-bold"
              >
                Continue
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
