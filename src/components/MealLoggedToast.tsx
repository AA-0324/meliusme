import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check } from 'lucide-react';
import { useEffect } from 'react';

type ToastVariant = 'primary' | 'success' | 'warning' | 'destructive';

interface MealLoggedToastProps {
  show: boolean;
  onHide: () => void;
  message?: string;
  variant?: ToastVariant;
}

export function MealLoggedToast({ show, onHide, message = 'Meal logged!', variant = 'primary' }: MealLoggedToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onHide, 1400);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  const variantClasses: Record<ToastVariant, string> = {
    primary: 'bg-primary text-primary-foreground shadow-primary/30',
    success: 'bg-success text-success-foreground shadow-success/30',
    warning: 'bg-warning text-warning-foreground shadow-warning/30',
    destructive: 'bg-destructive text-destructive-foreground shadow-destructive/30',
  };

  const Icon = variant === 'warning' || variant === 'destructive' ? AlertTriangle : Check;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed inset-x-0 bottom-0 z-[200] pointer-events-none px-4 pb-20 safe-bottom"
        >
          <div className="w-full max-w-lg mx-auto">
            <div className={
              `w-full rounded-2xl border border-border/40 backdrop-blur-sm shadow-lg ${variantClasses[variant]}`
            }>
              <div className="flex items-center gap-2.5 px-4 py-3">
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold text-sm leading-tight truncate">{message}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
