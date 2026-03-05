import { Variants, Transition } from 'framer-motion';

// Check reduced motion preference
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Standard easing curves
export const ease = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.4, 0, 0.2, 1] as const,
  spring: { type: 'spring' as const, damping: 20, stiffness: 300 },
  springBouncy: { type: 'spring' as const, damping: 12, stiffness: 200 },
  springGentle: { type: 'spring' as const, damping: 25, stiffness: 150 },
};

// Standard durations (seconds)
export const duration = {
  micro: 0.15,
  fast: 0.25,
  normal: 0.35,
  emphasis: 0.4,
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

// ─── Page Transition Variants ───
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const pageTransition: Transition = {
  duration: duration.normal,
  ease: ease.out as any,
};

// ─── Stagger Container ───
export const staggerContainer = (staggerDelay = 0.06): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: staggerDelay },
  },
});

// ─── Fade Up Item ───
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out as any },
  },
};

// ─── Fade In Scale ───
export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.fast, ease: ease.out as any },
  },
};

// ─── Card Hover (desktop) ───
export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: { y: -4, scale: 1.01 },
  tap: { scale: 0.98 },
};

// ─── Button Press ───
export const buttonPress = {
  whileTap: { scale: 0.97 },
  transition: ease.spring,
};

export const buttonPressPrimary = {
  whileTap: { scale: 0.96 },
  whileHover: { scale: 1.01 },
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
  initial: { opacity: 0, scale: 0.92, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
};

// ─── Number counter helper ───
export function countTo(target: number, durationMs = 600): { value: number; done: boolean }[] {
  const steps = Math.ceil(durationMs / 16);
  const result: { value: number; done: boolean }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    result.push({ value: Math.round(eased * target), done: i === steps });
  }
  return result;
}
