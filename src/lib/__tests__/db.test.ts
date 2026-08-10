import { describe, it, expect, beforeEach } from 'vitest';
import { addMeal, getMeal, getAllMeals, getMealsByDate, getMealsByDateRange, updateMeal, deleteMeal, deleteMealsByDate, getDB, exportMealsToCSV } from '@/lib/db';
import type { Meal } from '@/lib/db';
import { isEncrypted } from '@/lib/crypto';

const base = {
  photo: '',
  calories: 500,
  mealType: 'lunch' as const,
  date: '2025-01-10',
  time: '12:00',
};

async function clearMeals() {
  const db = await getDB();
  await db.clear('meals');
}

describe('meal persistence', () => {
  beforeEach(clearMeals);

  it('stores meals as ciphertext, never as readable JSON', async () => {
    await addMeal({ ...base, calories: 1234 });
    const db = await getDB();
    const [row] = await db.getAll('meals');
    expect(row.encrypted).not.toContain('1234');
    expect(row.encrypted).not.toContain('lunch');
    expect(isEncrypted(row.encrypted)).toBe(true);
  });

  it('reads a stored meal back intact', async () => {
    const saved = await addMeal({ ...base, protein: 30, fiber: 5, sugar: 8, tags: ['home'] });
    const loaded = await getMeal(saved.id);
    expect(loaded).toEqual(saved);
  });

  it('returns undefined for an unknown id', async () => {
    expect(await getMeal('does-not-exist')).toBeUndefined();
  });

  it('filters by exact date', async () => {
    await addMeal({ ...base, date: '2025-01-09' });
    const target = await addMeal({ ...base, date: '2025-01-10' });
    await addMeal({ ...base, date: '2025-01-11' });
    const day = await getMealsByDate('2025-01-10');
    expect(day.map(m => m.id)).toEqual([target.id]);
  });

  it('filters by an inclusive date range', async () => {
    for (const date of ['2025-01-08', '2025-01-09', '2025-01-10', '2025-01-12']) {
      await addMeal({ ...base, date });
    }
    const range = await getMealsByDateRange('2025-01-09', '2025-01-10');
    expect(range.map(m => m.date).sort()).toEqual(['2025-01-09', '2025-01-10']);
  });

  it('sorts results newest first', async () => {
    const a = await addMeal({ ...base, calories: 1 });
    const b = await addMeal({ ...base, calories: 2 });
    const all = await getAllMeals();
    expect(all[0].createdAt).toBeGreaterThanOrEqual(all[all.length - 1].createdAt);
    expect(new Set(all.map(m => m.id))).toEqual(new Set([a.id, b.id]));
  });

  it('updates a meal and keeps the new value readable', async () => {
    const saved = await addMeal(base);
    const updated = await updateMeal(saved.id, { calories: 900 });
    expect(updated?.calories).toBe(900);
    expect((await getMeal(saved.id))?.calories).toBe(900);
  });

  it('deletes a single meal without touching the cache of others', async () => {
    const a = await addMeal(base);
    const b = await addMeal({ ...base, calories: 700 });
    await deleteMeal(a.id);
    expect(await getMeal(a.id)).toBeUndefined();
    expect((await getMeal(b.id))?.calories).toBe(700);
  });

  it('deletes every meal on a given day only', async () => {
    await addMeal({ ...base, date: '2025-01-10' });
    await addMeal({ ...base, date: '2025-01-10' });
    const keep = await addMeal({ ...base, date: '2025-01-11' });
    await deleteMealsByDate('2025-01-10');
    const all = await getAllMeals();
    expect(all.map(m => m.id)).toEqual([keep.id]);
  });

  it('skips unreadable rows instead of throwing', async () => {
    const good = await addMeal(base);
    const db = await getDB();
    await db.put('meals', { id: 'corrupt', encrypted: 'this-is-not-decryptable' } as unknown as Meal & { encrypted: string });
    const all = await getAllMeals();
    expect(all.map(m => m.id)).toEqual([good.id]);
  });

  it('exports decrypted meals to CSV', async () => {
    await addMeal({ ...base, calories: 420, protein: 12, tags: ['a', 'b'] });
    const csv = await exportMealsToCSV();
    const [header, row] = csv.split('\n');
    expect(header).toBe('Date,Time,Meal Type,Calories,Protein,Fiber,Sugar,Tags');
    expect(row).toContain('420');
    expect(row).toContain('a; b');
  });
});
