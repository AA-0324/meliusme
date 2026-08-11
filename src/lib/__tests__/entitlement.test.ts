import { describe, it, expect } from 'vitest';
import { resolveEntitlement, resolveEffectivePro, nextPersistedProStatus, readEntitlementCache, writeEntitlementCache, EMPTY_ENTITLEMENT, CACHE_GRACE_MS } from '@/lib/entitlement';

describe('entitlement resolution', () => {
  it('trusts a verified positive answer', () => {
    const state = resolveEntitlement(true, { active: false, checkedAt: 1 });
    expect(state).toMatchObject({ active: true, source: 'verified' });
  });

  it('trusts a verified negative answer over a stale positive cache', () => {
    const state = resolveEntitlement(false, { active: true, checkedAt: 1 });
    expect(state).toMatchObject({ active: false, source: 'verified' });
  });

  it('falls back to a fresh cache when verification is unavailable', () => {
    const checkedAt = Date.now() - 1000;
    const state = resolveEntitlement(null, { active: true, checkedAt });
    expect(state).toEqual({ active: true, source: 'cached', checkedAt, stale: false });
  });

  it('stops honouring a cached purchase once the offline grace period lapses', () => {
    const checkedAt = Date.now() - CACHE_GRACE_MS - 1;
    const state = resolveEntitlement(null, { active: true, checkedAt });
    expect(state).toMatchObject({ active: false, source: 'cached', stale: true });
  });

  it('reports nothing when offline with no cache', () => {
    expect(resolveEntitlement(null, null)).toEqual(EMPTY_ENTITLEMENT);
  });

  it('never labels a cached answer as verified', () => {
    expect(resolveEntitlement(null, { active: true, checkedAt: 1 }).source).not.toBe('verified');
  });
});

describe('effective Pro access', () => {
  it('uses the persisted flag only when nothing is known', () => {
    expect(resolveEffectivePro(EMPTY_ENTITLEMENT, true)).toBe(true);
    expect(resolveEffectivePro(EMPTY_ENTITLEMENT, false)).toBe(false);
  });

  it('lets a verified negative answer override a persisted true flag', () => {
    const state = resolveEntitlement(false, null);
    expect(resolveEffectivePro(state, true)).toBe(false);
  });

  it('only revokes the persisted flag on a verified negative answer', () => {
    expect(nextPersistedProStatus(resolveEntitlement(false, null), true)).toBe(false);
    expect(nextPersistedProStatus(resolveEntitlement(true, null), false)).toBe(true);
    expect(nextPersistedProStatus(EMPTY_ENTITLEMENT, true)).toBe(true);
    expect(nextPersistedProStatus(resolveEntitlement(null, { active: true, checkedAt: Date.now() }), true)).toBe(true);
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
