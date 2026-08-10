import { describe, it, expect } from 'vitest';
import { toDateKey, todayKey, shiftDateKey, fromDateKey, daysBetween } from '@/lib/date';

describe('date keys', () => {
  it('formats a local date, not a UTC one', () => {
    // 1 Jan 2025 00:30 local — UTC-based formatting would report 31 Dec for
    // anyone east of UTC and is exactly the bug these helpers replace.
    const d = new Date(2025, 0, 1, 0, 30);
    expect(toDateKey(d)).toBe('2025-01-01');
  });

  it('zero-pads months and days so keys sort lexically', () => {
    expect(toDateKey(new Date(2025, 8, 5))).toBe('2025-09-05');
    expect('2025-09-05' < '2025-09-10').toBe(true);
  });

  it('shifts across month and year boundaries', () => {
    expect(shiftDateKey(-1, new Date(2025, 0, 1))).toBe('2024-12-31');
    expect(shiftDateKey(1, new Date(2025, 1, 28))).toBe('2025-03-01');
  });

  it('round-trips a key through a Date', () => {
    expect(toDateKey(fromDateKey('2025-07-04'))).toBe('2025-07-04');
  });

  it('counts whole days between keys, including across DST', () => {
    expect(daysBetween('2025-03-08', '2025-03-09')).toBe(1);
    expect(daysBetween('2025-03-01', '2025-04-01')).toBe(31);
    expect(daysBetween('2025-03-02', '2025-03-01')).toBe(-1);
  });

  it('todayKey matches toDateKey of now', () => {
    expect(todayKey()).toBe(toDateKey(new Date()));
  });
});
