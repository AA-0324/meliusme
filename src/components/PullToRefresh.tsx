import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const y = useMotionValue(0);
  
  const indicatorOpacity = useTransform(y, [0, 40, 80], [0, 0.5, 1]);
  const indicatorScale = useTransform(y, [0, 60, 80], [0.5, 0.8, 1]);
  const indicatorRotate = useTransform(y, [0, 80, 120], [0, 180, 360]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 5) return;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || isRefreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 5) {
      isDragging.current = false;
      animate(y, 0, { duration: 0.3 });
      return;
    }
    const delta = Math.max(0, e.touches[0].clientY - startY.current);
    // Elastic resistance
    const dampened = Math.min(delta * 0.45, 120);
    y.set(dampened);
  }, [isRefreshing, y]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const currentY = y.get();
    if (currentY >= 70 && !isRefreshing) {
      setIsRefreshing(true);
      animate(y, 60, { type: 'spring', damping: 20 });
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        animate(y, 0, { type: 'spring', damping: 25, stiffness: 300 });
      }
    } else {
      animate(y, 0, { type: 'spring', damping: 25, stiffness: 300 });
    }
  }, [y, isRefreshing, onRefresh]);

  return (
    <div className="relative overflow-hidden">
      {/* Pull indicator */}
      <motion.div
        style={{ opacity: indicatorOpacity, scale: indicatorScale, y: useTransform(y, v => v - 40) }}
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
      >
        <motion.div
          style={{ rotate: isRefreshing ? undefined : indicatorRotate }}
          animate={isRefreshing ? { rotate: 360 } : {}}
          transition={isRefreshing ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : {}}
          className="w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center"
        >
          <RefreshCw className="w-5 h-5 text-primary" />
        </motion.div>
      </motion.div>
      
      <motion.div
        ref={containerRef}
        style={{ y }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </div>
  );
}
