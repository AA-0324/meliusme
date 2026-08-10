import { describe, it, expect, beforeEach } from 'vitest';
import { getStreakData, saveStreakData, updateStreak, validateStreakFreshness } from '@/lib/streaks';
import { todayKey, shiftDateKey } from '@/lib/date';

const reset = () => saveStreakData({ currentStreak: 0, longestStreak: 0, lastLogDate: null, streakHistory: [] });

describe('streaks', () => {
  beforeEach(reset);

  it('starts a streak on the first logged day', async () => {
    const data = await updateStreak('2025-01-10');
    expect(data.currentStreak).toBe(1);
    expect(data.longestStreak).toBe(1);
  });

  it('extends the streak on consecutive days', async () => {
    await updateStreak('2025-01-10');
    await updateStreak('2025-01-11');
    const data = await updateStreak('2025-01-12');
    expect(data.currentStreak).toBe(3);
  });

  it('ignores a second meal on the same day', async () => {
    await updateStreak('2025-01-10');
    const data = await updateStreak('2025-01-10');
    expect(data.currentStreak).toBe(1);
    expect(data.streakHistory).toEqual(['2025-01-10']);
  });

  it('restarts after a missed day but keeps the longest streak', async () => {
    await updateStreak('2025-01-10');
    await updateStreak('2025-01-11');
    const data = await updateStreak('2025-01-15');
    expect(data.currentStreak).toBe(1);
    expect(data.longestStreak).toBe(2);
  });

  it('handles month boundaries', async () => {
    await updateStreak('2025-01-31');
    const data = await updateStreak('2025-02-01');
    expect(data.currentStreak).toBe(2);
  });

  it('keeps a streak alive when the last log was today or yesterday', async () => {
    await saveStreakData({ currentStreak: 5, longestStreak: 9, lastLogDate: todayKey(), streakHistory: [] });
    expect((await validateStreakFreshness()).currentStreak).toBe(5);

    await saveStreakData({ currentStreak: 5, longestStreak: 9, lastLogDate: shiftDateKey(-1), streakHistory: [] });
    expect((await validateStreakFreshness()).currentStreak).toBe(5);
  });

  it('expires a stale streak and persists the reset', async () => {
    await saveStreakData({ currentStreak: 12, longestStreak: 12, lastLogDate: shiftDateKey(-3), streakHistory: [] });
    const validated = await validateStreakFreshness();
    expect(validated.currentStreak).toBe(0);
    expect(validated.longestStreak).toBe(12);
    expect((await getStreakData()).currentStreak).toBe(0);
  });

  it('is a no-op when there is no streak yet', async () => {
    const data = await validateStreakFreshness();
    expect(data.currentStreak).toBe(0);
    expect(data.lastLogDate).toBeNull();
  });
});
