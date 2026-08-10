// Shared nutrition aggregation helpers.
//
// Several screens repeatedly filtered the full meal array per widget. These
// helpers build the aggregate once so callers can memoize a single indexed
// structure instead of scanning the array many times per render.

import type { Meal } from './db';

export interface NutritionTotals {
  calories: number;
  protein: number;
  fiber: number;
  sugar: number;
}

export const EMPTY_TOTALS: NutritionTotals = { calories: 0, protein: 0, fiber: 0, sugar: 0 };

export function sumMeals(meals: Iterable<Meal>): NutritionTotals {
  let calories = 0, protein = 0, fiber = 0, sugar = 0;
  for (const m of meals) {
    calories += m.calories || 0;
    protein += m.protein || 0;
    fiber += m.fiber || 0;
    sugar += m.sugar || 0;
  }
  return { calories, protein, fiber, sugar };
}

/** Single pass index of meals by their date key. */
export function groupMealsByDate(meals: Meal[]): Map<string, Meal[]> {
  const map = new Map<string, Meal[]>();
  for (const meal of meals) {
    const bucket = map.get(meal.date);
    if (bucket) bucket.push(meal);
    else map.set(meal.date, [meal]);
  }
  return map;
}

/** Totals for one date. Pass a prebuilt index to avoid rescanning. */
export function getDailyTotals(
  source: Meal[] | Map<string, Meal[]>,
  date: string,
): NutritionTotals {
  if (source instanceof Map) return sumMeals(source.get(date) ?? []);
  let calories = 0, protein = 0, fiber = 0, sugar = 0;
  for (const m of source) {
    if (m.date !== date) continue;
    calories += m.calories || 0;
    protein += m.protein || 0;
    fiber += m.fiber || 0;
    sugar += m.sugar || 0;
  }
  return { calories, protein, fiber, sugar };
}

export function addTotals(a: NutritionTotals, b: Partial<NutritionTotals>): NutritionTotals {
  return {
    calories: a.calories + (b.calories || 0),
    protein: a.protein + (b.protein || 0),
    fiber: a.fiber + (b.fiber || 0),
    sugar: a.sugar + (b.sugar || 0),
  };
}
