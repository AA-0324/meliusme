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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-bottom">
      <div className="grid grid-cols-4 h-[64px] max-w-lg mx-auto relative items-center">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex items-center justify-center h-full relative"
            >
              <motion.div
                className="flex flex-col items-center justify-center gap-1"
                whileTap={{ scale: 0.82 }}
                transition={{ type: 'spring', damping: 15, stiffness: 400 }}
              >
                <div className="relative flex items-center justify-center">
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -inset-2.5 bg-primary/15 rounded-xl"
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
                </div>
                <span className={cn(
                  'text-[10px] font-medium transition-colors duration-200 leading-none',
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
