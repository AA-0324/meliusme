import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
  showAnimation?: boolean;
}

export function ProgressRing({ 
  progress, 
  size = 160, 
  strokeWidth = 12,
  children,
  showAnimation = false,
}: ProgressRingProps) {
  const { animationsEnabled } = useApp();
  const noMotion = !animationsEnabled;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const getColor = () => {
    if (progress >= 100) return 'hsl(var(--success))';
    if (progress >= 80) return 'hsl(var(--primary))';
    if (progress >= 60) return 'hsl(var(--chart-3))';
    if (progress >= 30) return 'hsl(var(--chart-2))';
    return 'hsl(var(--muted-foreground))';
  };
  
  const getGlowColor = () => {
    if (progress >= 100) return 'hsl(var(--success) / 0.5)';
    if (progress >= 80) return 'hsl(var(--primary) / 0.4)';
    if (progress >= 60) return 'hsl(var(--chart-3) / 0.3)';
    return 'transparent';
  };

  return (
    <motion.div 
      className="relative inline-flex items-center justify-center"
      animate={!noMotion && progress >= 100 ? { 
        scale: [1, 1.04, 1],
      } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        
        {/* Completion animation - pulsing ring */}
        {progress >= 100 && showAnimation && !noMotion && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth / 2}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference, opacity: 0.5 }}
            animate={{ 
              strokeDashoffset: 0,
              opacity: [0.6, 1, 0],
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        {/* Rotating dot at the end of progress */}
        {progress > 0 && progress < 100 && !noMotion && (
          <motion.circle
            cx={size / 2 + radius * Math.cos((2 * Math.PI * progress / 100) - Math.PI / 2)}
            cy={size / 2 + radius * Math.sin((2 * Math.PI * progress / 100) - Math.PI / 2)}
            r={strokeWidth / 2 + 2}
            fill={getColor()}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 1.4, 1], 
              opacity: [0.8, 1, 0.8],
            }}
            transition={{ 
              delay: 1.2,
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              filter: `drop-shadow(0 0 6px ${getGlowColor()})`,
            }}
          />
        )}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </motion.div>
  );
}
