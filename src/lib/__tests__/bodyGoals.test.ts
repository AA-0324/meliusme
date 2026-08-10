import { describe, it, expect } from 'vitest';
import { generateAutoGoals, isBodyProfileComplete, feetToCm, cmToFeet, lbsToKg, kgToLbs } from '@/lib/bodyGoals';

const profile = { age: 30, heightCm: 180, weightKg: 80, sex: 'male' as const };

describe('unit conversions', () => {
  it('round-trips height', () => {
    const { feet, inches } = cmToFeet(180);
    expect(feetToCm(feet, inches)).toBeCloseTo(180, 0);
  });

  it('round-trips weight', () => {
    expect(lbsToKg(kgToLbs(80))).toBeCloseTo(80, 0);
  });
});

describe('generateAutoGoals', () => {
  it('refuses to guess from an incomplete profile', () => {
    expect(generateAutoGoals({ age: 30 })).toBeNull();
    expect(generateAutoGoals({ ...profile })).toBeNull(); // no goal set
  });

  it('sets a surplus for bulking and a deficit for cutting', () => {
    const maintain = generateAutoGoals({ ...profile, goal: 'maintain' })!;
    const bulk = generateAutoGoals({ ...profile, goal: 'bulking' })!;
    const cut = generateAutoGoals({ ...profile, goal: 'cutting' })!;
    expect(bulk.calories).toBeGreaterThan(maintain.calories);
    expect(cut.calories).toBeLessThan(maintain.calories);
  });

  it('asks for the most protein when cutting', () => {
    const bulk = generateAutoGoals({ ...profile, goal: 'bulking' })!;
    const cut = generateAutoGoals({ ...profile, goal: 'cutting' })!;
    expect(cut.protein).toBeGreaterThan(bulk.protein);
  });

  it('produces plausible, positive targets', () => {
    const goals = generateAutoGoals({ ...profile, goal: 'maintain' })!;
    expect(goals.calories).toBeGreaterThan(1200);
    expect(goals.calories).toBeLessThan(5000);
    expect(goals.protein).toBeGreaterThan(0);
    expect(goals.fiber).toBeGreaterThan(0);
    expect(goals.sugarLimit).toBeGreaterThan(0);
  });

  it('scales calories with body size', () => {
    const light = generateAutoGoals({ ...profile, weightKg: 55, goal: 'maintain' })!;
    const heavy = generateAutoGoals({ ...profile, weightKg: 110, goal: 'maintain' })!;
    expect(heavy.calories).toBeGreaterThan(light.calories);
  });

  it('averages the formula when sex is not disclosed', () => {
    const male = generateAutoGoals({ ...profile, sex: 'male', goal: 'maintain' })!;
    const female = generateAutoGoals({ ...profile, sex: 'female', goal: 'maintain' })!;
    const unspecified = generateAutoGoals({ ...profile, sex: 'prefer_not_to_say', goal: 'maintain' })!;
    expect(unspecified.calories).toBeGreaterThan(female.calories);
    expect(unspecified.calories).toBeLessThan(male.calories);
  });
});

describe('isBodyProfileComplete', () => {
  it('requires age, height, weight and a goal', () => {
    expect(isBodyProfileComplete(null)).toBe(false);
    expect(isBodyProfileComplete({ ...profile })).toBe(false);
    expect(isBodyProfileComplete({ ...profile, goal: 'maintain' })).toBe(true);
  });
});
