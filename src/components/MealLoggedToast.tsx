import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { AlertTriangle, Check, Trophy } from 'lucide-react';
import { useEffect, useRef } from 'react';

type ToastVariant = 'primary' | 'success' | 'warning' | 'destructive' | 'challenge';

interface MealLoggedToastProps {
  show: boolean;
  onHide: () => void;
  message?: string;
  variant?: ToastVariant;
}

export function MealLoggedToast({ show, onHide, message = 'Meal logged!', variant = 'primary' }: MealLoggedToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (show) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onHide, variant === 'challenge' ? 3500 : 2500);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [show, message, onHide, variant]);

  // Unified look across every in-app toast: same neutral card, subtle
  // border + shadow. Only the icon (and its accent color) shifts to hint
  // at the semantic meaning of the message.
  const iconColorClasses: Record<ToastVariant, string> = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
    challenge: 'text-success',
  };

  const Icon = variant === 'warning' || variant === 'destructive' ? AlertTriangle : variant === 'challenge' ? Trophy : Check;

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.y) > 30 || Math.abs(info.offset.x) > 60) {
      onHide();
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          drag
          dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
          dragElastic={0.4}
          onDragEnd={handleDragEnd}
          className="fixed inset-x-0 bottom-[72px] z-[200] px-4 safe-bottom cursor-grab active:cursor-grabbing"
        >
          <div className="w-full rounded-xl border border-border bg-background text-foreground shadow-lg">
            <div className="flex items-center gap-2.5 px-4 py-3">
              <Icon className={`w-4 h-4 flex-shrink-0 ${iconColorClasses[variant]}`} />
              <span className="font-semibold text-sm leading-tight flex-1 line-clamp-2">{message}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
