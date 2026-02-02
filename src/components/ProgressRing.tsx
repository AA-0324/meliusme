import { motion } from 'framer-motion';

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
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Color based on progress - clearly visible
  const getColor = () => {
    if (progress >= 100) return 'hsl(var(--success))';
    if (progress >= 80) return 'hsl(var(--primary))';
    if (progress >= 60) return 'hsl(var(--chart-3))'; // warning/amber
    if (progress >= 30) return 'hsl(var(--chart-2))'; // blue
    return 'hsl(var(--muted-foreground))';
  };
  
  // Get glow color for visibility
  const getGlowColor = () => {
    if (progress >= 100) return 'hsl(var(--success) / 0.5)';
    if (progress >= 80) return 'hsl(var(--primary) / 0.4)';
    if (progress >= 60) return 'hsl(var(--chart-3) / 0.3)';
    return 'transparent';
  };

  return (
    <div className="relative inline-flex items-center justify-center">
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
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            filter: progress >= 60 ? `drop-shadow(0 0 8px ${getGlowColor()})` : undefined,
          }}
        />
        
        {/* Completion animation */}
        {progress >= 100 && showAnimation && (
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
              opacity: [0.5, 1, 0],
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
