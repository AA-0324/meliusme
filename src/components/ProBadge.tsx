import { Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProBadgeProps {
  className?: string;
  showLock?: boolean;
}

export function ProBadge({ className, showLock = true }: ProBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
      'bg-gradient-to-r from-warning to-warning/80 text-warning-foreground',
      className
    )}>
      {showLock ? <Lock className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
      PRO
    </span>
  );
}
