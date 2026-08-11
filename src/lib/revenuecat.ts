// RevenueCat Web SDK integration.
//
// Only the *public* SDK key belongs in client code. It is read from
// `VITE_REVENUECAT_PUBLIC_KEY` so the sandbox/test key and the production key
// can differ per build. When no key is configured the module degrades to a
// no-op: Pro simply stays unverified and the free app keeps working.
import { Purchases, type CustomerInfo, type Package, type PurchasesError, ErrorCode } from '@revenuecat/purchases-js';
import { getEncrypted, setEncrypted } from './encryptedStorage';
import {
  readEntitlementCache,
  writeEntitlementCache,
  resolveEntitlement,
  PRO_ENTITLEMENT_ID,
  EMPTY_ENTITLEMENT,
  type EntitlementState,
} from './entitlement';

// Sandbox/test key kept as the development fallback so the paywall keeps
// working in preview builds. Production builds must set
// VITE_REVENUECAT_PUBLIC_KEY to the live *public* key.
const RC_FALLBACK_TEST_KEY = 'test_bfVjcQrjQkSYSlezfcbSEpCZRaE';
const RC_API_KEY =
  ((import.meta.env?.VITE_REVENUECAT_PUBLIC_KEY as string | undefined)?.trim() || RC_FALLBACK_TEST_KEY).trim();
const ENTITLEMENT_ID = PRO_ENTITLEMENT_ID;
const RC_USER_ID_KEY = 'melius-rc-user-id';

let purchasesInstance: Purchases | null = null;
let initPromise: Promise<Purchases | null> | null = null;

/** True when a public SDK key is configured for this build. */
export function isRevenueCatConfigured(): boolean {
  return RC_API_KEY.length > 0;
}

// ─── Initialization ────────────────────────────────────────────────

async function getOrCreateUserId(): Promise<string> {
  let userId = await getEncrypted(RC_USER_ID_KEY);
  if (!userId) {
    userId = Purchases.generateRevenueCatAnonymousAppUserId();
    await setEncrypted(RC_USER_ID_KEY, userId);
  }
  return userId;
}

/**
 * Configure the SDK. Returns null when RevenueCat is unconfigured or cannot be
 * reached — callers must treat null as "entitlement unknown", never as "free".
 */
export async function initRevenueCat(): Promise<Purchases | null> {
  if (purchasesInstance) return purchasesInstance;
  if (!isRevenueCatConfigured()) {
    console.warn('[RevenueCat] No VITE_REVENUECAT_PUBLIC_KEY configured — purchases are disabled.');
    return null;
  }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const appUserId = await getOrCreateUserId();
      purchasesInstance = Purchases.configure({ apiKey: RC_API_KEY, appUserId });
      return purchasesInstance;
    } catch (error) {
      console.warn('[RevenueCat] Configure failed:', error);
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export async function getRevenueCatInstance(): Promise<Purchases | null> {
  return purchasesInstance ?? initRevenueCat();
}

// ─── Customer Info & Entitlements ──────────────────────────────────

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  const rc = await getRevenueCatInstance();
  if (!rc) return null;
  return rc.getCustomerInfo();
}

/**
 * Ask RevenueCat whether the Pro entitlement is active.
 * Returns `null` when RevenueCat could not be reached or is not configured, so
 * callers can tell "verified as not entitled" apart from "unknown".
 */
export async function verifyProEntitlement(): Promise<boolean | null> {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return null;
    const active = ENTITLEMENT_ID in customerInfo.entitlements.active;
    await writeEntitlementCache(active);
    return active;
  } catch (error) {
    console.warn('[RevenueCat] Entitlement verification unavailable:', error);
    return null;
  }
}

/**
 * Entitlement state combining a fresh verification with the offline cache.
 * The `source` field says whether the answer is verified or merely cached.
 */
export async function getProEntitlementState(): Promise<EntitlementState> {
  try {
    const [verified, cache] = await Promise.all([verifyProEntitlement(), readEntitlementCache()]);
    return resolveEntitlement(verified, cache);
  } catch (error) {
    console.warn('[RevenueCat] Entitlement state unavailable:', error);
    return EMPTY_ENTITLEMENT;
  }
}

/** Boolean convenience wrapper. Unknown verification resolves to false. */
export async function checkProEntitlement(): Promise<boolean> {
  return (await verifyProEntitlement()) === true;
}

export async function hasAnyActiveEntitlement(): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return false;
    return Object.keys(customerInfo.entitlements.active).length > 0;
  } catch (error) {
    console.error('[RevenueCat] Failed to check entitlements:', error);
    return false;
  }
}

// ─── Offerings & Products ──────────────────────────────────────────

export async function getCurrentOffering() {
  try {
    const rc = await getRevenueCatInstance();
    if (!rc) return null;
    const offerings = await rc.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('[RevenueCat] Failed to get offerings:', error);
    return null;
  }
}

export async function getAvailablePackages(): Promise<Package[]> {
  const offering = await getCurrentOffering();
  return offering?.availablePackages ?? [];
}

/**
 * Validate that the current offering has packages available.
 * Returns a descriptive error string if something is wrong, or null if OK.
 */
export async function validateOffering(): Promise<string | null> {
  if (!isRevenueCatConfigured()) {
    return 'Purchases are not configured for this build.';
  }
  try {
    const rc = await getRevenueCatInstance();
    if (!rc) return 'Could not reach RevenueCat. Please check your internet connection.';
    const offering = await getCurrentOffering();
    if (!offering) {
      return 'No active offering found in RevenueCat. Please check your dashboard configuration.';
    }
    if (offering.availablePackages.length === 0) {
      return 'The active offering has no packages. Please add a product in RevenueCat.';
    }
    return null;
  } catch (error) {
    console.error('[RevenueCat] Offering validation failed:', error);
    return 'Could not reach RevenueCat. Please check your internet connection.';
  }
}

// ─── Purchases ─────────────────────────────────────────────────────

export interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  cancelled?: boolean;
  /** True when RevenueCat could not be reached — entitlement is unknown, not false. */
  unavailable?: boolean;
  error?: string;
}

export async function purchasePackage(pkg: Package): Promise<PurchaseResult> {
  try {
    const rc = await getRevenueCatInstance();
    if (!rc) return { success: false, unavailable: true, error: 'Purchases are unavailable right now.' };
    const { customerInfo } = await rc.purchase({ rcPackage: pkg });

    const hasPro = ENTITLEMENT_ID in customerInfo.entitlements.active;
    await writeEntitlementCache(hasPro);
    return { success: hasPro, customerInfo };
  } catch (e: unknown) {
    const error = e as PurchasesError;
    if (error?.errorCode === ErrorCode.UserCancelledError) {
      return { success: false, cancelled: true };
    }
    console.error('[RevenueCat] Purchase failed:', error);
    return { success: false, error: error?.message || 'Purchase failed' };
  }
}

// ─── Paywall ───────────────────────────────────────────────────────

export interface PaywallResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}

export async function presentPaywall(containerElement: HTMLElement): Promise<PaywallResult> {
  try {
    const rc = await getRevenueCatInstance();
    if (!rc) return { success: false, error: 'Purchases are unavailable right now.' };
    const result = await rc.presentPaywall({ htmlTarget: containerElement });

    return { success: true, customerInfo: result.customerInfo };
  } catch (error: unknown) {
    console.error('[RevenueCat] Paywall error:', error);
    return { success: false, error: (error as Error).message || 'Paywall error' };
  }
}

// ─── Restore Purchases ────────────────────────────────────────────

export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    // On the web SDK, "restoring" means re-reading customer info for the same
    // anonymous app user id, which picks up any purchase tied to that user.
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) {
      return { success: false, unavailable: true, error: 'Could not reach RevenueCat.' };
    }
    const hasPro = ENTITLEMENT_ID in customerInfo.entitlements.active;
    await writeEntitlementCache(hasPro);
    return { success: hasPro, customerInfo };
  } catch (error: unknown) {
    console.error('[RevenueCat] Restore failed:', error);
    return { success: false, unavailable: true, error: (error as Error).message || 'Restore failed' };
  }
}

// ─── Customer Center (Web) ─────────────────────────────────────────

export function isCustomerCenterAvailable(): boolean {
  return false;
}
