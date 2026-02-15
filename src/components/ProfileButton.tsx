import { User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

export function ProfileButton() {
  const { userProfile } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on profile and settings pages
  if (location.pathname === '/profile' || location.pathname === '/settings') {
    return null;
  }

  return (
    <button
      onClick={() => navigate('/profile')}
      className="w-9 h-9 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-colors flex-shrink-0 shadow-sm"
    >
      {userProfile?.avatar ? (
        <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-secondary flex items-center justify-center">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </button>
  );
}
