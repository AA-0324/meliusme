import { Variants, Transition } from 'framer-motion';

// Check reduced motion preference OR user setting
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  const animationsEnabled = (window as any).__melius_animations_enabled;
  if (animationsEnabled === false) return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Standard easing curves
export const ease = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.4, 0, 0.2, 1] as const,
  spring: { type: 'spring' as const, damping: 20, stiffness: 300 },
  springBouncy: { type: 'spring' as const, damping: 10, stiffness: 180 },
  springGentle: { type: 'spring' as const, damping: 25, stiffness: 150 },
  springSnappy: { type: 'spring' as const, damping: 12, stiffness: 400 },
  springDramatic: { type: 'spring' as const, damping: 8, stiffness: 120 },
};

// Standard durations (seconds)
export const duration = {
  micro: 0.15,
  fast: 0.25,
  normal: 0.4,
  emphasis: 0.6,
  dramatic: 0.8,
};

// Reduced-motion-safe wrapper
export function safeVariants(variants: Variants): Variants {
  if (prefersReducedMotion()) {
    const safe: Variants = {};
    for (const key of Object.keys(variants)) {
      safe[key] = { opacity: (variants[key] as any)?.opacity };
    }
    return safe;
  }
  return variants;
}

// Conditional motion props — returns empty object when animations disabled
export function motionProps(props: Record<string, any>): Record<string, any> {
  if (prefersReducedMotion()) return {};
  return props;
}

// ─── Page Transition Variants ───
export const pageVariants: Variants = {
  initial: { opacity: 1, y: 0, scale: 1 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 1, y: 0, scale: 1 },
};

export const pageTransition: Transition = {
  duration: duration.emphasis,
  ease: ease.out as any,
};

// ─── Stagger Container (more dramatic delays) ───
export const staggerContainer = (_staggerDelay = 0.1): Variants => {
  if (prefersReducedMotion()) return { hidden: {}, show: {} };
  return {
    hidden: {},
    show: {
      transition: { staggerChildren: 0, delayChildren: 0 },
    },
  };
};

// ─── Fade Up Item (BIGGER movement) ───
export const fadeUp: Variants = {
  hidden: { opacity: 1, y: 0, scale: 1 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: duration.emphasis, 
      ease: ease.out as any,
    },
  },
};

// ─── Fade Up with spring bounce ───
export const fadeUpBounce: Variants = {
  hidden: { opacity: 1, y: 0, scale: 1 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      type: 'spring',
      damping: 12,
      stiffness: 150,
    },
  },
};

// ─── Slide in from left ───
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -60, scale: 0.9 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring', damping: 14, stiffness: 150 },
  },
};

// ─── Slide in from right ───
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 60, scale: 0.9 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring', damping: 14, stiffness: 150 },
  },
};

// Safe fadeUp that respects reduced motion
export const safeFadeUp = (): Variants => {
  if (prefersReducedMotion()) return { hidden: { opacity: 1 }, show: { opacity: 1 } };
  return fadeUp;
};

// ─── Fade In Scale (BIGGER) ───
export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.7 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', damping: 12, stiffness: 200 },
  },
};

// ─── Card Hover (desktop) ───
export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: { y: -8, scale: 1.03 },
  tap: { scale: 0.95 },
};

// ─── Button Press ───
export const buttonPress = {
  whileTap: { scale: 0.9 },
  transition: ease.spring,
};

export const buttonPressPrimary = {
  whileTap: { scale: 0.88 },
  whileHover: { scale: 1.05, y: -3 },
  transition: ease.springBouncy,
};

// ─── Slide from right (sheets/modals) ───
export const slideRight: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
};

// ─── Modal / overlay ───
export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.75, y: 50 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.85, y: 30 },
};

// ─── Pop in (for success states, badges, etc.) ───
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.3, rotate: -15 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: 'spring', damping: 10, stiffness: 200 },
  },
};

// ─── Bounce subtle ───
export const bounceSubtle = {
  animate: {
    y: [0, -12, 0],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
};

// ─── Dramatic idle float ───
export const idleFloat = {
  animate: {
    y: [0, -10, 0],
    rotate: [0, 2, -2, 0],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
};

// ─── Breathing scale ───
export const idleBreathe = {
  animate: {
    scale: [1, 1.06, 1],
    transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
  },
};

// ─── Pulsing glow (for active elements) ───
export const idlePulse = {
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.8, 1, 0.8],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },
};

// ─── Number counter helper ───
export function countTo(target: number, durationMs = 600): { value: number; done: boolean }[] {
  const steps = Math.ceil(durationMs / 16);
  const result: { value: number; done: boolean }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const eased = 1 - Math.pow(1 - t, 3);
    result.push({ value: Math.round(eased * target), done: i === steps });
  }
  return result;
}
