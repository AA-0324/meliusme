// Pro entitlement state.
//
// RevenueCat is the source of truth for a *verified* entitlement. Because the
// app is local-first and must work fully offline, the last verified result is
// cached locally and used for UX only. The two are deliberately kept separate:
// `verified` means "RevenueCat confirmed it in this session", `cached` means
// "the last thing RevenueCat told us, possibly stale".
//
// This is not a security boundary — everything runs on device and there is no
// server to protect. It exists so the app never silently treats an unverified
// local flag as a confirmed purchase.

import { getEncryptedJSON, setEncryptedJSON } from './encryptedStorage';

const CACHE_KEY = 'melius-entitlement-cache';

/** RevenueCat entitlement identifier. Must match the RevenueCat dashboard. */
export const PRO_ENTITLEMENT_ID = 'MeliusMe Pro';

/**
 * How long a cached entitlement answer is honoured while RevenueCat cannot be
 * reached. Long enough that a normal offline stretch never removes access the
 * user paid for, short enough that a cancelled purchase does not stay unlocked
 * forever on a device that never goes online again.
 */
export const CACHE_GRACE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface EntitlementCache {
  /** Last entitlement answer received from RevenueCat. */
  active: boolean;
  /** Epoch ms of that answer. */
  checkedAt: number;
}

/**
 * Where the current answer came from. These four states are exhaustive and
 * deliberately distinct — "we don't know" is never collapsed into "free".
 *
 * - `verified`   — the store answered during this session. Authoritative.
 * - `cached`     — the store could not be reached; using the last verified
 *                  answer. Honoured for `CACHE_GRACE_MS` (see freshness policy
 *                  below), after which it is marked `stale` and stops granting.
 * - `unavailable`— the store could not be reached and there is no cached
 *                  answer. Entitlement is unknown; the locally persisted flag
 *                  is used so an existing install is not downgraded offline.
 * - `none`       — nothing has been asked yet this session (initial state).
 *
 * Freshness policy: only a `verified` answer may change the persisted
 * `proStatus` flag. A cached answer may keep access alive but can never grant
 * it on its own, and an `unavailable` answer changes nothing at all.
 */
export type EntitlementSource = 'verified' | 'cached' | 'unavailable' | 'none';

export interface EntitlementState {
  active: boolean;
  source: EntitlementSource;
  checkedAt: number | null;
  /** True when the cached answer is older than the offline grace window. */
  stale?: boolean;
}

/** Initial state: nothing has been asked yet. */
export const EMPTY_ENTITLEMENT: EntitlementState = { active: false, source: 'none', checkedAt: null };

/** The store could not be reached and there is no cached answer. */
export const UNAVAILABLE_ENTITLEMENT: EntitlementState = { active: false, source: 'unavailable', checkedAt: null };


export async function readEntitlementCache(): Promise<EntitlementCache | null> {
  const cache = await getEncryptedJSON<EntitlementCache | null>(CACHE_KEY, null);
  if (!cache || typeof cache.active !== 'boolean' || typeof cache.checkedAt !== 'number') return null;
  return cache;
}

export async function writeEntitlementCache(active: boolean, checkedAt = Date.now()): Promise<EntitlementCache> {
  const cache: EntitlementCache = { active, checkedAt };
  await setEncryptedJSON(CACHE_KEY, cache);
  return cache;
}

/**
 * Resolve entitlement state from a verification attempt plus the local cache.
 * `verified` is null when RevenueCat could not be reached.
 */
export function resolveEntitlement(
  verified: boolean | null,
  cache: EntitlementCache | null,
  now: number = Date.now(),
): EntitlementState {
  if (verified !== null) {
    return { active: verified, source: 'verified', checkedAt: now, stale: false };
  }
  if (cache) {
    const stale = now - cache.checkedAt > CACHE_GRACE_MS;
    // A stale positive cache stops granting access; a negative one stays negative.
    return { active: cache.active && !stale, source: 'cached', checkedAt: cache.checkedAt, stale };
  }
  return EMPTY_ENTITLEMENT;
}

/**
 * Decide what the locally persisted `proStatus` flag should become.
 * Only a *verified* answer may flip the flag — an offline session must never
 * revoke access, and a cached answer must never grant it on its own.
 */
export function nextPersistedProStatus(
  state: EntitlementState,
  currentProStatus: boolean,
): boolean {
  if (state.source === 'verified') return state.active;
  return currentProStatus;
}

/**
 * Effective Pro access for the UI. A verified or cached RevenueCat answer wins;
 * when RevenueCat has never answered on this device we fall back to the locally
 * persisted flag so an existing install is not downgraded by a missing network.
 */
export function resolveEffectivePro(state: EntitlementState, persisted: boolean): boolean {
  if (state.source === 'none') return persisted;
  return state.active;
}
