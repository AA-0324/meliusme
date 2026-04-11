import { motion, AnimatePresence } from 'framer-motion';
import { Check, Utensils, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { modalOverlay, modalContent } from '@/lib/motion';

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
          variants={modalOverlay}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm text-center"
          >
            {/* Success icon with stroke-draw checkmark */}
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
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <motion.path
                    d="M12 20L18 26L28 14"
                    stroke="hsl(var(--primary-foreground))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.6, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
              </motion.div>
            </motion.div>

            <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-2xl font-bold mb-2">
              Day Complete
            </motion.h2>
            
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-muted-foreground mb-8">
              All meals logged for today. Great job!
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid grid-cols-2 gap-4 mb-8">
              <motion.div whileHover={{ y: -2 }} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-center justify-center gap-2 text-primary mb-2">
                  <Flame className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold"><AnimatedNumber value={totalCalories} /></p>
                <p className="text-xs text-muted-foreground">Total Calories</p>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-center justify-center gap-2 text-primary mb-2">
                  <Utensils className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold"><AnimatedNumber value={totalMeals} /></p>
                <p className="text-xs text-muted-foreground">Meals Logged</p>
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <Button onClick={onClose} className="w-full h-14 text-lg rounded-xl font-bold cta-glow">
                Continue
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
