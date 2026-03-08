import { Home, BookOpen, BarChart3, Trophy } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/log', icon: BookOpen, label: 'Log' },
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/challenges', icon: Trophy, label: 'Challenges' },
];

export function BottomNav() {
  const location = useLocation();
  const { animationsEnabled } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-center gap-2 h-[72px] max-w-[340px] mx-auto relative">
        {navItems.map(({ to, icon: Icon, label }, index) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex items-center justify-center flex-1 pt-3"
            >
              <motion.div
                className="relative flex flex-col items-center justify-center gap-1"
                whileTap={animationsEnabled ? { scale: 0.75 } : {}}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className={`absolute -inset-x-5 -inset-y-3 bg-primary/15 rounded-2xl ${animationsEnabled ? 'animate-glow-pulse' : ''}`}
                    transition={{ type: 'spring', damping: 18, stiffness: 300 }}
                  />
                )}
                <motion.div
                  animate={isActive && animationsEnabled ? {
                    y: [0, -3, 0],
                    scale: [1, 1.15, 1],
                  } : {}}
                  transition={isActive && animationsEnabled ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  } : {}}
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
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
