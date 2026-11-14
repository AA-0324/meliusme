// Google Play Billing for the Android TWA build.
// Uses the browser Digital Goods API + Payment Request API, then sends the
// purchase token to the Cloudflare Worker, which verifies it with RevenueCat
// using the secret key (never shipped to the client).
import { getOrCreateUserId } from './revenuecat';

export const PLAY_BILLING_METHOD = 'https://play.google.com/billing';
export const PLAY_PRO_PRODUCT_ID = 'pro_lifetime';
export const VERIFY_URL = 'https://meliusme-verify.arvindakshar.workers.dev/';

interface DigitalGoodsService {
  getDetails(ids: string[]): Promise<Array<{ itemId: string; title: string; price: { currency: string; value: string } }>>;
  listPurchases(): Promise<Array<{ itemId: string; purchaseToken: string }>>;
}
type DGWindow = Window & { getDigitalGoodsService?: (method: string) => Promise<DigitalGoodsService> };

let servicePromise: Promise<DigitalGoodsService | null> | null = null;

/** Resolves the Play billing service, or null outside the Play-installed TWA. */
export function getPlayBillingService(): Promise<DigitalGoodsService | null> {
  if (servicePromise) return servicePromise;
  const w = window as DGWindow;
  if (typeof w.getDigitalGoodsService !== 'function' || typeof PaymentRequest === 'undefined') {
    return Promise.resolve(null);
  }
  servicePromise = w.getDigitalGoodsService(PLAY_BILLING_METHOD).catch(() => null);
  return servicePromise;
}

async function verifyWithWorker(purchaseToken: string, productId: string): Promise<boolean> {
  const appUserId = await getOrCreateUserId();
  const res = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appUserId, purchaseToken, productId }),
  });
  if (!res.ok) throw new Error(`Verification failed (${res.status})`);
  const data = (await res.json()) as { isPro?: boolean };
  return data.isPro === true;
}

export type PlayPurchaseResult = 'purchased' | 'cancelled' | 'not_granted';

/** Opens the Google Play purchase sheet and verifies the result. Throws on errors. */
export async function purchaseProWithPlay(): Promise<PlayPurchaseResult> {
  const service = await getPlayBillingService();
  if (!service) throw new Error('Google Play Billing is unavailable');

  const request = new PaymentRequest(
    [{ supportedMethods: PLAY_BILLING_METHOD, data: { sku: PLAY_PRO_PRODUCT_ID } }],
    { total: { label: 'Total', amount: { currency: 'USD', value: '0' } } },
  );

  let response: PaymentResponse;
  try {
    response = await request.show();
  } catch (e) {
    if ((e as DOMException)?.name === 'AbortError') return 'cancelled';
    throw e;
  }

  const token = (response.details as { purchaseToken?: string })?.purchaseToken;
  if (!token) {
    await response.complete('fail');
    throw new Error('No purchase token returned');
  }
  try {
    const granted = await verifyWithWorker(token, PLAY_PRO_PRODUCT_ID);
    await response.complete(granted ? 'success' : 'fail');
    return granted ? 'purchased' : 'not_granted';
  } catch (e) {
    await response.complete('fail').catch(() => {});
    throw e;
  }
}

/** Re-verifies an existing Play purchase (reinstall / new device). */
export async function restorePlayPurchase(): Promise<boolean> {
  const service = await getPlayBillingService();
  if (!service) return false;
  const purchases = await service.listPurchases();
  const pro = purchases.find(p => p.itemId === PLAY_PRO_PRODUCT_ID);
  if (!pro) return false;
  return verifyWithWorker(pro.purchaseToken, PLAY_PRO_PRODUCT_ID);
}
