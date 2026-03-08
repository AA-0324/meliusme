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
  springBouncy: { type: 'spring' as const, damping: 12, stiffness: 200 },
  springGentle: { type: 'spring' as const, damping: 25, stiffness: 150 },
  springSnappy: { type: 'spring' as const, damping: 15, stiffness: 400 },
};

// Standard durations (seconds)
export const duration = {
  micro: 0.15,
  fast: 0.25,
  normal: 0.35,
  emphasis: 0.5,
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
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export const pageTransition: Transition = {
  duration: duration.normal,
  ease: ease.out as any,
};

// ─── Stagger Container ───
export const staggerContainer = (staggerDelay = 0.07): Variants => {
  if (prefersReducedMotion()) return { hidden: {}, show: {} };
  return {
    hidden: {},
    show: {
      transition: { staggerChildren: staggerDelay },
    },
  };
};

// ─── Fade Up Item ───
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out as any },
  },
};

// Safe fadeUp that respects reduced motion
export const safeFadeUp = (): Variants => {
  if (prefersReducedMotion()) return { hidden: { opacity: 1 }, show: { opacity: 1 } };
  return fadeUp;
};

// ─── Fade In Scale ───
export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.fast, ease: ease.out as any },
  },
};

// ─── Card Hover (desktop) ───
export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: { y: -6, scale: 1.02 },
  tap: { scale: 0.97 },
};

// ─── Button Press ───
export const buttonPress = {
  whileTap: { scale: 0.95 },
  transition: ease.spring,
};

export const buttonPressPrimary = {
  whileTap: { scale: 0.94 },
  whileHover: { scale: 1.02 },
  transition: ease.spring,
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
  initial: { opacity: 0, scale: 0.88, y: 30 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.92, y: 15 },
};

// ─── Pop in (for success states, badges, etc.) ───
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', damping: 12, stiffness: 200 },
  },
};

// ─── Bounce subtle ───
export const bounceSubtle = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
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
