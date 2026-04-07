import { Home, BookOpen, BarChart3, Trophy } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, LayoutGroup } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { useRef, useEffect, useState, useCallback } from 'react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/log', icon: BookOpen, label: 'Log' },
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/challenges', icon: Trophy, label: 'Challenges' },
];

export function BottomNav() {
  const location = useLocation();
  const { animationsEnabled } = useApp();
  const navRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number } | null>(null);
  const hasInitialized = useRef(false);

  const activeIndex = navItems.findIndex(({ to }) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
  );

  const updateIndicator = useCallback(() => {
    const el = navRefs.current[activeIndex];
    const container = containerRef.current;
    if (el && container) {
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setIndicatorStyle({
        left: elRect.left - containerRect.left + elRect.width / 2,
        width: elRect.width + 40,
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    updateIndicator();
    // Mark as initialized after first paint
    requestAnimationFrame(() => { hasInitialized.current = true; });
  }, [updateIndicator]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div ref={containerRef} className="flex justify-center gap-2 h-[72px] max-w-[340px] mx-auto relative py-2">
        {/* Single persistent indicator — never unmounts */}
        {indicatorStyle && (
          <motion.div
            className={`absolute top-[calc(50%+8px)] h-[calc(100%-18px)] bg-primary/15 rounded-2xl ${animationsEnabled ? 'animate-glow-pulse' : ''}`}
            initial={false}
            animate={{
              left: indicatorStyle.left - indicatorStyle.width / 2,
              width: indicatorStyle.width,
              y: '-50%',
            }}
            transition={
              hasInitialized.current && animationsEnabled
                ? { type: 'spring', damping: 22, stiffness: 300 }
                : { duration: 0 }
            }
          />
        )}

        {navItems.map(({ to, icon: Icon, label }, index) => {
          const isActive = index === activeIndex;
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex items-center justify-center flex-1"
            >
              <div
                ref={(el) => { navRefs.current[index] = el; }}
                className="relative flex flex-col items-center justify-center gap-1"
              >
                <motion.div
                  animate={isActive && animationsEnabled ? {
                    y: [0, -3, 0],
                    scale: [1, 1.15, 1],
                  } : { y: 0, scale: 1 }}
                  transition={isActive && animationsEnabled ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  } : { duration: 0.15 }}
                >
                  <Icon
                    className={cn(
                      'w-[22px] h-[22px] relative z-10 transition-colors duration-200',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </motion.div>
                <span className={cn(
                  'text-[10px] font-medium transition-colors duration-200 leading-none relative z-10',
                  isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                )}>
                  {label}
                </span>
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
