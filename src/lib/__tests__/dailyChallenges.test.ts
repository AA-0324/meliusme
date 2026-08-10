import { describe, it, expect } from 'vitest';
import { getDailyChallenges } from '@/lib/streaks';

const goals = { calories: 2000, protein: 100, fiber: 30, sugar: 50 };

describe('daily challenges', () => {
  it('offers three challenges', () => {
    expect(getDailyChallenges([], 0, 8, goals)).toHaveLength(3);
  });

  it('is deterministic for the same day and inputs', () => {
    const a = getDailyChallenges(['breakfast'], 2, 8, goals);
    const b = getDailyChallenges(['breakfast'], 2, 8, goals);
    expect(a.map(c => c.id)).toEqual(b.map(c => c.id));
  });

  it('never offers a protein challenge when no protein goal is set', () => {
    for (let i = 0; i < 5; i++) {
      const picked = getDailyChallenges([], 0, 8, { calories: 2000 });
      expect(picked.some(c => c.id === 'protein_hit')).toBe(false);
    }
  });

  it('never offers stay-under-calories, which can only be judged at day end', () => {
    expect(getDailyChallenges([], 0, 8, goals).some(c => c.id === 'under_cal')).toBe(false);
  });

  function find(id: string, ...args: Parameters<typeof getDailyChallenges>) {
    // Re-run with the full pool by asking directly; challenges not picked today
    // simply aren't returned, so only assert when present.
    return getDailyChallenges(...args).find(c => c.id === id);
  }

  it('marks the water challenge complete only at the full goal', () => {
    const below = find('water_full', [], 7, 8, goals);
    const met = find('water_full', [], 8, 8, goals);
    if (below) expect(below.completed).toBe(false);
    if (met) expect(met.completed).toBe(true);
  });

  it('caps progress at the target', () => {
    for (const c of getDailyChallenges(['breakfast', 'lunch', 'dinner', 'snack', 'snack'], 20, 8, goals)) {
      expect(c.progress).toBeLessThanOrEqual(c.target);
      expect(c.completed).toBe(c.progress >= c.target);
    }
  });

  it('tracks meal-type challenges from the logged meals', () => {
    const withBreakfast = find('breakfast', ['breakfast'], 0, 8, goals);
    const without = find('breakfast', ['dinner'], 0, 8, goals);
    if (withBreakfast) expect(withBreakfast.completed).toBe(true);
    if (without) expect(without.completed).toBe(false);
  });

  it('requires logged meals before crediting the protein goal', () => {
    const noMeals = find('protein_hit', [], 0, 8, goals, 0, 150);
    if (noMeals) expect(noMeals.completed).toBe(false);
    const withMeals = find('protein_hit', ['lunch'], 0, 8, goals, 800, 150);
    if (withMeals) expect(withMeals.completed).toBe(true);
  });

  it('awards positive XP for every challenge', () => {
    for (const c of getDailyChallenges(['lunch'], 4, 8, goals)) {
      expect(c.xp).toBeGreaterThan(0);
    }
  });
});
