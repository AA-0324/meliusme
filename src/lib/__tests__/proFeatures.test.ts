import { describe, it, expect, beforeEach } from 'vitest';
import { calculateNutritionScore, getDashboardLayout, saveDashboardLayout, resetDashboardLayout, saveMealTemplate, getMealTemplates, deleteMealTemplate } from '@/lib/proFeatures';

const goals = { calories: 2000, protein: 100, fiber: 30, sugar: 50 };

describe('calculateNutritionScore', () => {
  it('scores zero before anything is logged', () => {
    expect(calculateNutritionScore(0, 0, 0, 0, goals, false)).toBe(0);
    expect(calculateNutritionScore(1800, 90, 25, 20, goals, false)).toBe(0);
  });

  it('gives a perfect score when every target is met', () => {
    expect(calculateNutritionScore(2000, 100, 30, 40, goals, true)).toBe(100);
  });

  it('stays within 0-100 for extreme inputs', () => {
    expect(calculateNutritionScore(99999, 9999, 9999, 9999, goals, true)).toBeLessThanOrEqual(100);
    expect(calculateNutritionScore(10, 0, 0, 0, goals, true)).toBeGreaterThanOrEqual(0);
  });

  it('rewards being closer to the calorie target', () => {
    const onTarget = calculateNutritionScore(2000, 100, 30, 40, goals, true);
    const off = calculateNutritionScore(3200, 100, 30, 40, goals, true);
    expect(onTarget).toBeGreaterThan(off);
  });

  it('penalises exceeding the sugar limit', () => {
    const under = calculateNutritionScore(2000, 100, 30, 40, goals, true);
    const over = calculateNutritionScore(2000, 100, 30, 200, goals, true);
    expect(over).toBeLessThan(under);
  });

  it('falls back to sensible defaults when goals are missing', () => {
    const score = calculateNutritionScore(2000, 60, 25, 10, { calories: 0 } as never, true);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('dashboard layout persistence', () => {
  beforeEach(resetDashboardLayout);

  it('returns widgets ordered by their order field', async () => {
    const layout = await getDashboardLayout();
    const orders = layout.map(w => w.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });

  it('persists hidden and reordered widgets', async () => {
    const layout = await getDashboardLayout();
    const changed = layout.map((w, i) => ({ ...w, visible: i !== 0, order: layout.length - i }));
    await saveDashboardLayout(changed);
    const loaded = await getDashboardLayout();
    expect(loaded[loaded.length - 1].visible).toBe(false);
  });

  it('restores defaults on reset', async () => {
    const layout = await getDashboardLayout();
    await saveDashboardLayout(layout.map(w => ({ ...w, visible: false })));
    await resetDashboardLayout();
    expect((await getDashboardLayout()).every(w => w.visible)).toBe(true);
  });
});

describe('meal templates', () => {
  it('saves, lists newest first, and deletes templates', async () => {
    for (const t of await getMealTemplates()) await deleteMealTemplate(t.id);
    const first = await saveMealTemplate({ name: 'Oats', mealType: 'breakfast', calories: 350 });
    const second = await saveMealTemplate({ name: 'Chicken', mealType: 'dinner', calories: 600 });
    const listed = await getMealTemplates();
    expect(listed.map(t => t.name)).toEqual(['Chicken', 'Oats']);
    await deleteMealTemplate(second.id);
    expect((await getMealTemplates()).map(t => t.id)).toEqual([first.id]);
  });
});
