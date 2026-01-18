import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MealLoggedToastProps {
  show: boolean;
  onHide: () => void;
}

export function MealLoggedToast({ show, onHide }: MealLoggedToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onHide, 1200);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[150]"
        >
          <div className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 10 }}
            >
              <Check className="w-5 h-5" />
            </motion.div>
            <span className="font-bold text-sm">Meal logged ✓</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
