import { describe, it, expect } from 'vitest';
import { getGoalFeedback } from '@/lib/goalFeedback';
import type { NutritionTotals } from '@/lib/nutrition';

const totals = (t: Partial<NutritionTotals>): NutritionTotals => ({
  calories: 0, protein: 0, fiber: 0, sugar: 0, ...t,
});

const goals = { calories: 2000, protein: 100, fiber: 30, sugar: 50 };

describe('getGoalFeedback', () => {
  it('says nothing while the user is below every target', () => {
    expect(getGoalFeedback(totals({ calories: 300 }), totals({ calories: 800 }), goals)).toEqual([]);
  });

  it('announces a goal exactly once, on the crossing', () => {
    const first = getGoalFeedback(totals({ calories: 1900 }), totals({ calories: 2000 }), goals);
    expect(first.map(f => f.key)).toContain('calories_done');
    const again = getGoalFeedback(totals({ calories: 2000 }), totals({ calories: 2100 }), goals, { calories_done: true, calories_over: true });
    expect(again).toEqual([]);
  });

  it('reports going above a target neutrally, without blame', () => {
    const [feedback] = getGoalFeedback(totals({ calories: 1990 }), totals({ calories: 2400 }), goals, { calories_done: true });
    expect(feedback.key).toBe('calories_over');
    expect(feedback.variant).toBe('warning');
    expect(feedback.message).toBe("You're above your calorie target for today.");
    expect(feedback.message).not.toMatch(/should|fail|bad|too much|lighter/i);
  });

  it('treats sugar as a limit, not a goal to reach', () => {
    const reached = getGoalFeedback(totals({ sugar: 10 }), totals({ sugar: 50 }), goals);
    expect(reached).toEqual([]);
    const over = getGoalFeedback(totals({ sugar: 50 }), totals({ sugar: 60 }), goals);
    expect(over.map(f => f.key)).toEqual(['sugar_over']);
  });

  it('skips macros that have no goal set', () => {
    const out = getGoalFeedback(totals({ protein: 0 }), totals({ protein: 200 }), { calories: 2000 });
    expect(out).toEqual([]);
  });

  it('can report several crossings from one meal', () => {
    const out = getGoalFeedback(
      totals({ calories: 1000, protein: 40, fiber: 10 }),
      totals({ calories: 2100, protein: 120, fiber: 35 }),
      goals,
    );
    expect(out.map(f => f.key).sort()).toEqual(['calories_done', 'calories_over', 'fiber_done', 'protein_done']);
  });
});
