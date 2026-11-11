import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppProvider, useApp } from '../AppContext';
import * as db from '@/lib/db';
vi.mock('@/lib/revenuecat', () => ({ initRevenueCat: async () => {}, getProEntitlementState: async () => ({ active: false, source: 'none', checkedAt: null, stale: false }) }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
describe('daily reset persistence', () => {
  it('loads the new local day water count after foreground return at midnight', async () => {
    vi.spyOn(db, 'getWaterIntake').mockImplementation(async date => date === '2026-11-10' ? 8 : 0);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 10, 23, 59));
    const { result } = renderHook(useApp, { wrapper: AppProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.todayWater).toBe(8));
    vi.setSystemTime(new Date(2026, 10, 11, 0, 1));
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    await waitFor(() => expect(result.current.todayWater).toBe(0));
  });
  it('waits for meal deletion to commit before reporting completion', async () => {
    let finish: () => void = () => {};
    const deletion = vi.spyOn(db, 'deleteMealsByDate').mockImplementation(() => new Promise<void>(r => { finish = r; }));
    const { result } = renderHook(useApp, { wrapper: AppProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let completed = false;
    let pending: Promise<void>;
    act(() => { pending = Promise.resolve(result.current.resetDailyData()).then(() => { completed = true; }); });
    await waitFor(() => expect(deletion).toHaveBeenCalled());
    expect(completed).toBe(false);
    await act(async () => { finish(); await pending; });
    expect(completed).toBe(true);
  });
  it('propagates deletion failure and leaves water unchanged', async () => {
    vi.spyOn(db, 'deleteMealsByDate').mockRejectedValue(new Error('Deletion failed'));
    const { result } = renderHook(useApp, { wrapper: AppProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const water = vi.spyOn(db, 'setWaterIntake');
    await act(async () => { await expect(result.current.resetDailyData()).rejects.toThrow('Deletion failed'); });
    expect(water).not.toHaveBeenCalled();
  });
});
