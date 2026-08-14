// The single, narrow entitlement authority for the app.
//
// Nothing in the UI may grant or revoke Pro. The only operation exposed is
// "go and reconcile with the store", which:
//   1. asks the active billing provider,
//   2. resolves that against the encrypted offline cache,
//   3. persists the resulting flag *only* when the answer was verified.
//
// This deliberately replaces the old `setPro(boolean)` context method, which
// let any component assert Pro locally.

import { getBillingProvider, type RestoreOutcome } from './billing';
import { getSettings, saveSettings, revokeProStatus, type Settings } from './db';
import {
  readEntitlementCache,
  resolveEntitlement,
  nextPersistedProStatus,
  UNAVAILABLE_ENTITLEMENT,
  type EntitlementState,
} from './entitlement';

export interface ReconcileResult {
  state: EntitlementState;
  /** Settings after any persisted-flag change. Unchanged object when nothing moved. */
  settings: Settings;
}

/**
 * Ask the store, reconcile the cache, and persist the flag when (and only when)
 * the answer was verified. Never throws: a failed reconciliation leaves the
 * current access exactly as it was.
 */
export async function reconcileEntitlement(): Promise<ReconcileResult> {
  const current = await getSettings();
  let state: EntitlementState = UNAVAILABLE_ENTITLEMENT;

  try {
    const provider = getBillingProvider();
    const [verified, cache] = await Promise.all([
      provider.isConfigured() ? provider.verifyEntitlement() : Promise.resolve(null),
      readEntitlementCache(),
    ]);
    state = resolveEntitlement(verified, cache);
  } catch (error) {
    console.warn('[entitlement] Reconciliation unavailable:', error);
    return { state, settings: current };
  }

  const persisted = nextPersistedProStatus(state, current.proStatus);
  if (persisted === current.proStatus) return { state, settings: current };

  const settings = persisted ? await saveSettings({ proStatus: true }) : await revokeProStatus();
  return { state, settings };
}

/**
 * Ask the store to restore a previous purchase, then reconcile.
 * The outcome is reported verbatim so the UI can be honest about what the
 * current platform can and cannot do.
 */
export async function restoreAndReconcile(): Promise<ReconcileResult & { outcome: RestoreOutcome }> {
  let outcome: RestoreOutcome = 'unavailable';
  try {
    outcome = await getBillingProvider().restore();
  } catch (error) {
    console.warn('[entitlement] Restore unavailable:', error);
  }
  const reconciled = await reconcileEntitlement();
  return { ...reconciled, outcome };
}

/** Whether the active platform can honestly promise cross-device restore. */
export function canRestoreAcrossDevices(): boolean {
  return getBillingProvider().canRestoreAcrossDevices;
}

/** Whether this build can sell or verify Pro at all. */
export function isBillingConfigured(): boolean {
  return getBillingProvider().isConfigured();
}
