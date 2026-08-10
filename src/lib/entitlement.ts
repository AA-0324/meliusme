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

export interface EntitlementCache {
  /** Last entitlement answer received from RevenueCat. */
  active: boolean;
  /** Epoch ms of that answer. */
  checkedAt: number;
}

export type EntitlementSource = 'verified' | 'cached' | 'none';

export interface EntitlementState {
  active: boolean;
  source: EntitlementSource;
  checkedAt: number | null;
}

export const EMPTY_ENTITLEMENT: EntitlementState = { active: false, source: 'none', checkedAt: null };

export async function readEntitlementCache(): Promise<EntitlementCache | null> {
  return getEncryptedJSON<EntitlementCache | null>(CACHE_KEY, null);
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
): EntitlementState {
  if (verified !== null) {
    return { active: verified, source: 'verified', checkedAt: Date.now() };
  }
  if (cache) {
    return { active: cache.active, source: 'cached', checkedAt: cache.checkedAt };
  }
  return EMPTY_ENTITLEMENT;
}
