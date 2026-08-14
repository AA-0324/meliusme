// Platform-agnostic billing abstraction.
//
// The app currently ships as a web build (and as a TWA wrapping that same web
// build), where RevenueCat's *web* SDK is the only store we can talk to. A
// later release phase is expected to add Google Play billing. To keep that
// change contained, every entitlement question in the app goes through this
// interface instead of importing RevenueCat directly.
//
// Deliberate non-goals: no React Native, no native Android modules, no
// platform detection magic. Adding Google Play later means writing one more
// object that satisfies `BillingProvider` and returning it from
// `getBillingProvider()`.

import {
  isRevenueCatConfigured,
  verifyProEntitlement as rcVerifyProEntitlement,
  restorePurchases as rcRestorePurchases,
} from './revenuecat';

/** Result of asking the store to restore a previous purchase. */
export type RestoreOutcome =
  /** The store confirmed an active entitlement for this identity. */
  | 'restored'
  /** The store answered, and this identity owns nothing. */
  | 'nothing-found'
  /** The store could not be reached — entitlement is unknown, not absent. */
  | 'unavailable'
  /** This platform has no restore mechanism we can honestly offer. */
  | 'unsupported';

export interface BillingProvider {
  /** Stable identifier, used in logs and docs only. */
  readonly id: 'revenuecat-web' | 'google-play';

  /** Human-readable name of the store this provider talks to. */
  readonly storeName: string;

  /**
   * True when this build has the credentials it needs. A provider that is not
   * configured must never be treated as "user is not entitled" — the app stays
   * fully usable, Pro simply cannot be purchased or verified.
   */
  isConfigured(): boolean;

  /**
   * `true` / `false` when the store answered, `null` when it could not be
   * reached or is unconfigured.
   */
  verifyEntitlement(): Promise<boolean | null>;

  /**
   * Whether a purchase made on one device can be recovered on another.
   * The web SDK ties purchases to an anonymous per-device app user id, so it
   * cannot. The UI reads this flag instead of promising something untrue.
   */
  readonly canRestoreAcrossDevices: boolean;

  restore(): Promise<RestoreOutcome>;
}

/**
 * RevenueCat Web provider.
 *
 * Identity is an anonymous app user id generated on first launch and stored
 * (encrypted) on this device. There is no account system, so RevenueCat has no
 * way to link the same purchase to a second device. `canRestoreAcrossDevices`
 * is therefore false and "restore" only means "re-read this device's identity".
 */
const revenueCatWebProvider: BillingProvider = {
  id: 'revenuecat-web',
  storeName: 'RevenueCat',
  canRestoreAcrossDevices: false,
  isConfigured: isRevenueCatConfigured,
  async verifyEntitlement() {
    return rcVerifyProEntitlement();
  },
  async restore() {
    if (!isRevenueCatConfigured()) return 'unsupported';
    const result = await rcRestorePurchases();
    if (result.unavailable) return 'unavailable';
    return result.success ? 'restored' : 'nothing-found';
  },
};

/**
 * The active provider for this build.
 *
 * When Google Play billing lands, add a `googlePlayProvider` (Digital Goods
 * API from inside the TWA — still no native dependency) and select it here.
 */
export function getBillingProvider(): BillingProvider {
  return revenueCatWebProvider;
}
