// Pure goal-crossing feedback.
//
// Given the day's totals before and after a meal, decide which one-shot
// messages should be surfaced. Kept free of storage and React so it can be
// unit tested directly.
//
// Tone rule: messages are informative, never moralising. Passing a target is
// reported as a neutral fact ("above your target"), not as a failure.

import type { Goals } from './db';
import type { NutritionTotals } from './nutrition';

export type GoalFeedbackVariant = 'success' | 'warning';

export interface GoalFeedback {
  /** Stable key used to make each message fire at most once per day. */
  key: string;
  message: string;
  variant: GoalFeedbackVariant;
}

function crossedUp(prev: number, next: number, target: number): boolean {
  return prev < target && next >= target;
}

function wentOver(prev: number, next: number, target: number): boolean {
  return prev <= target && next > target;
}

export function getGoalFeedback(
  prev: NutritionTotals,
  next: NutritionTotals,
  goals: Goals,
  alreadyShown: Record<string, boolean> = {},
): GoalFeedback[] {
  const out: GoalFeedback[] = [];
  const push = (key: string, message: string, variant: GoalFeedbackVariant) => {
    if (alreadyShown[key]) return;
    out.push({ key, message, variant });
  };

  if (goals.calories) {
    if (crossedUp(prev.calories, next.calories, goals.calories)) {
      push('calories_done', 'Calorie goal reached for today.', 'success');
    }
    if (wentOver(prev.calories, next.calories, goals.calories)) {
      push('calories_over', "You're above your calorie target for today.", 'warning');
    }
  }

  if (goals.protein && crossedUp(prev.protein, next.protein, goals.protein)) {
    push('protein_done', 'Protein goal reached for today.', 'success');
  }

  if (goals.fiber && crossedUp(prev.fiber, next.fiber, goals.fiber)) {
    push('fiber_done', 'Fiber goal reached for today.', 'success');
  }

  if (goals.sugar && wentOver(prev.sugar, next.sugar, goals.sugar)) {
    push('sugar_over', "You're above your sugar target for today.", 'warning');
  }

  return out;
}
