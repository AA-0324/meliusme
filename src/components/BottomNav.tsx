import { Home, BookOpen, BarChart3, Trophy, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/log', icon: BookOpen, label: 'Log' },
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/challenges', icon: Trophy, label: 'Challenges' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const { userProfile } = useApp();
  const hasAvatar = !!userProfile?.avatar;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200',
                'active:scale-95',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                {to === '/profile' && hasAvatar ? (
                  <img
                    src={userProfile!.avatar!}
                    alt="Profile"
                    className={cn(
                      'w-6 h-6 rounded-full object-cover transition-transform duration-200',
                      isActive && 'ring-2 ring-primary ring-offset-1 ring-offset-card'
                    )}
                  />
                ) : (
                  <Icon className={cn('w-6 h-6 transition-transform duration-200', isActive && 'scale-110')} strokeWidth={isActive ? 2.5 : 2} />
                )}
                <span className={cn('text-xs mt-1 font-medium', isActive && 'font-semibold')}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
