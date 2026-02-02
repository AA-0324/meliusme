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
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
        >
          <div className="flex items-center gap-3 px-6 py-4 bg-primary text-primary-foreground rounded-2xl shadow-2xl shadow-primary/40">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 10 }}
            >
              <Check className="w-6 h-6" />
            </motion.div>
            <span className="font-bold text-lg">Meal logged!</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
