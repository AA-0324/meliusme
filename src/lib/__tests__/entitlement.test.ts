import { describe, it, expect } from 'vitest';
import { resolveEntitlement, readEntitlementCache, writeEntitlementCache, EMPTY_ENTITLEMENT } from '@/lib/entitlement';

describe('entitlement resolution', () => {
  it('trusts a verified positive answer', () => {
    const state = resolveEntitlement(true, { active: false, checkedAt: 1 });
    expect(state).toMatchObject({ active: true, source: 'verified' });
  });

  it('trusts a verified negative answer over a stale positive cache', () => {
    const state = resolveEntitlement(false, { active: true, checkedAt: 1 });
    expect(state).toMatchObject({ active: false, source: 'verified' });
  });

  it('falls back to the cache when verification is unavailable', () => {
    const state = resolveEntitlement(null, { active: true, checkedAt: 42 });
    expect(state).toEqual({ active: true, source: 'cached', checkedAt: 42 });
  });

  it('reports nothing when offline with no cache', () => {
    expect(resolveEntitlement(null, null)).toEqual(EMPTY_ENTITLEMENT);
  });

  it('never labels a cached answer as verified', () => {
    expect(resolveEntitlement(null, { active: true, checkedAt: 1 }).source).not.toBe('verified');
  });
});

describe('entitlement cache', () => {
  it('round-trips through encrypted storage', async () => {
    await writeEntitlementCache(true, 1234);
    expect(await readEntitlementCache()).toEqual({ active: true, checkedAt: 1234 });
    await writeEntitlementCache(false, 5678);
    expect(await readEntitlementCache()).toEqual({ active: false, checkedAt: 5678 });
  });
});
