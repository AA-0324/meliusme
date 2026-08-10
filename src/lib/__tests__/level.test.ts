import { describe, it, expect } from 'vitest';
import { calculateLevel } from '@/lib/streaks';

describe('calculateLevel', () => {
  it('starts everyone at level 1', () => {
    const data = calculateLevel(0);
    expect(data).toMatchObject({ level: 1, currentLevelXP: 0, xpToNextLevel: 100, totalXP: 0 });
  });

  it('keeps a user below the threshold at the same level', () => {
    expect(calculateLevel(99).level).toBe(1);
    expect(calculateLevel(99).currentLevelXP).toBe(99);
  });

  it('levels up exactly at the threshold', () => {
    expect(calculateLevel(100).level).toBe(2);
    expect(calculateLevel(100).currentLevelXP).toBe(0);
  });

  it('scales the requirement for each level', () => {
    const l2 = calculateLevel(100);
    const l3 = calculateLevel(100 + l2.xpToNextLevel);
    expect(l3.level).toBe(3);
    expect(l3.xpToNextLevel).toBeGreaterThan(l2.xpToNextLevel);
  });

  it('is monotonic — more XP never lowers the level', () => {
    let prev = 1;
    for (let xp = 0; xp <= 20000; xp += 137) {
      const { level } = calculateLevel(xp);
      expect(level).toBeGreaterThanOrEqual(prev);
      prev = level;
    }
  });

  it('never reports more current-level XP than the level requires', () => {
    for (let xp = 0; xp <= 5000; xp += 61) {
      const { currentLevelXP, xpToNextLevel } = calculateLevel(xp);
      expect(currentLevelXP).toBeGreaterThanOrEqual(0);
      expect(currentLevelXP).toBeLessThan(xpToNextLevel);
    }
  });
});
