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

  // Extra padding needed for the glow effect
  const glowPadding = progress >= 60 && !noMotion ? 8 : 0;
  const totalSize = size + glowPadding * 2;

  return (
    <motion.div 
      className="relative inline-flex items-center justify-center"
      style={{ width: totalSize, height: totalSize }}
      animate={!noMotion && progress >= 100 ? { 
        scale: [1, 1.04, 1],
      } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width={totalSize} height={totalSize} className="-rotate-90" style={{ overflow: 'visible' }}>
        {/* Background circle */}
        <circle
          cx={totalSize / 2}
          cy={totalSize / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={totalSize / 2}
          cy={totalSize / 2}
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

        {/* Glow filter for progress arc */}
        {progress >= 60 && !noMotion && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getGlowColor()}
            strokeWidth={strokeWidth + 6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ filter: 'blur(6px)' }}
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
