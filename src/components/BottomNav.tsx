import { Home, BookOpen, BarChart3, Trophy } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/log', icon: BookOpen, label: 'Log' },
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/challenges', icon: Trophy, label: 'Challenges' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-center gap-0 h-[72px] max-w-[280px] mx-auto relative">
        {navItems.map(({ to, icon: Icon, label }) => {
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
                whileTap={{ scale: 0.82 }}
                transition={{ type: 'spring', damping: 15, stiffness: 400 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -inset-x-4 -inset-y-2 bg-primary/15 rounded-2xl"
                    transition={{ type: 'spring', damping: 22, stiffness: 350 }}
                  />
                )}
                <Icon
                  className={cn(
                    'w-[22px] h-[22px] relative z-10 transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
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
