// RevenueCat Web SDK Integration
import { Purchases, type CustomerInfo, type Package, type PurchasesError, ErrorCode } from '@revenuecat/purchases-js';

// Public API key (safe to include in client code)
const RC_API_KEY = 'test_bfVjcQrjQkSYSlezfcbSEpCZRaE';
const ENTITLEMENT_ID = 'MeliusMe Pro';
const RC_USER_ID_KEY = 'melius-rc-user-id';

let purchasesInstance: Purchases | null = null;

// ─── Initialization ────────────────────────────────────────────────

function getOrCreateUserId(): string {
  let userId = localStorage.getItem(RC_USER_ID_KEY);
  if (!userId) {
    userId = Purchases.generateRevenueCatAnonymousAppUserId();
    localStorage.setItem(RC_USER_ID_KEY, userId);
  }
  return userId;
}

export function initRevenueCat(): Purchases {
  if (purchasesInstance) return purchasesInstance;

  const appUserId = getOrCreateUserId();
  purchasesInstance = Purchases.configure({
    apiKey: RC_API_KEY,
    appUserId,
  });

  return purchasesInstance;
}

export function getRevenueCatInstance(): Purchases {
  if (!purchasesInstance) {
    return initRevenueCat();
  }
  return purchasesInstance;
}

// ─── Customer Info & Entitlements ──────────────────────────────────

export async function getCustomerInfo(): Promise<CustomerInfo> {
  const rc = getRevenueCatInstance();
  return await rc.getCustomerInfo();
}

export async function checkProEntitlement(): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    return ENTITLEMENT_ID in customerInfo.entitlements.active;
  } catch (error) {
    console.error('[RevenueCat] Failed to check entitlement:', error);
    return false;
  }
}

export async function hasAnyActiveEntitlement(): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    return Object.keys(customerInfo.entitlements.active).length > 0;
  } catch (error) {
    console.error('[RevenueCat] Failed to check entitlements:', error);
    return false;
  }
}

// ─── Offerings & Products ──────────────────────────────────────────

export async function getCurrentOffering() {
  try {
    const rc = getRevenueCatInstance();
    const offerings = await rc.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('[RevenueCat] Failed to get offerings:', error);
    return null;
  }
}

export async function getAvailablePackages(): Promise<Package[]> {
  try {
    const offering = await getCurrentOffering();
    if (offering && offering.availablePackages.length > 0) {
      return offering.availablePackages;
    }
    return [];
  } catch (error) {
    console.error('[RevenueCat] Failed to get packages:', error);
    return [];
  }
}

// ─── Purchases ─────────────────────────────────────────────────────

export interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  cancelled?: boolean;
  error?: string;
}

export async function purchasePackage(pkg: Package): Promise<PurchaseResult> {
  try {
    const rc = getRevenueCatInstance();
    const { customerInfo } = await rc.purchase({ rcPackage: pkg });

    const hasPro = ENTITLEMENT_ID in customerInfo.entitlements.active;
    return { success: hasPro, customerInfo };
  } catch (e: unknown) {
    const error = e as PurchasesError;
    if (error.errorCode === ErrorCode.UserCancelledError) {
      return { success: false, cancelled: true };
    }
    console.error('[RevenueCat] Purchase failed:', error);
    return { success: false, error: error.message || 'Purchase failed' };
  }
}

// ─── Paywall ───────────────────────────────────────────────────────

export interface PaywallResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}

export async function presentPaywall(
  containerElement: HTMLElement
): Promise<PaywallResult> {
  try {
    const rc = getRevenueCatInstance();
    const result = await rc.presentPaywall({
      htmlTarget: containerElement,
    });

    return {
      success: true,
      customerInfo: result.customerInfo,
    };
  } catch (error: unknown) {
    console.error('[RevenueCat] Paywall error:', error);
    return {
      success: false,
      error: (error as Error).message || 'Paywall error',
    };
  }
}

// ─── Restore Purchases ────────────────────────────────────────────

export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    const customerInfo = await getCustomerInfo();
    const hasPro = ENTITLEMENT_ID in customerInfo.entitlements.active;
    return { success: hasPro, customerInfo };
  } catch (error: unknown) {
    console.error('[RevenueCat] Restore failed:', error);
    return { success: false, error: (error as Error).message || 'Restore failed' };
  }
}

// ─── Customer Center (Web) ─────────────────────────────────────────
// Note: RevenueCat Customer Center is currently only available on 
// native iOS/Android SDKs. For web, we provide a manual management
// experience via the app's Settings page. When Customer Center becomes
// available for web, this can be updated.

export function isCustomerCenterAvailable(): boolean {
  // Customer Center is not yet supported on web SDK
  return false;
}
