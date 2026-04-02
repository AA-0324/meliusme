

# Fix RevenueCat Pro Purchase Integration

## Problem Analysis

The current code uses `presentPaywall()` correctly from the SDK, but has these issues:

1. **No `onBack` handler** -- when the user closes/backs out of the paywall, there's no handler, so the modal may hang or not close properly.
2. **Missing offering identifier** -- the RevenueCat offering is named `"sale"` (not the default), but the code doesn't pass a specific offering to `presentPaywall`. The SDK should pick it up if it's set as "Current" in the dashboard, but this should be explicit as a safeguard.
3. **Paywall result not properly handled** -- `presentPaywall` returns a `PaywallPurchaseResult` with `customerInfo` that should be checked for the entitlement directly, rather than making a separate API call.
4. **Pro status reset migration conflicts** -- on app load, lines 163-168 in AppContext reset proStatus to `false` (migration `meliusme-pro-reset-v1.1`), which could override a legitimate RevenueCat entitlement on first load.
5. **No cleanup of paywall DOM** -- when modal closes, the paywall container's inner HTML is never cleared, potentially causing stale state on re-open.

## Plan

### 1. Fix `ProUpgradeModal.tsx`

- Add `onBack` callback to `presentPaywall` that calls `onClose()` -- this lets users dismiss the paywall via the paywall's own back button.
- Check `customerInfo.entitlements.active` directly from the paywall result instead of making a second `checkProEntitlement()` call.
- Clear the paywall container innerHTML when the modal closes to prevent stale renders.
- Remove the separate close button since `onBack` handles dismissal (or keep it and wire it to clean up properly).
- Add proper error handling distinguishing between user cancellation and real errors.

### 2. Fix `revenuecat.ts`

- Keep the existing helper functions as-is (they are correct).
- No changes needed -- the SDK is initialized properly and `presentPaywall` is called directly on the Purchases instance in the modal.

### 3. Fix `AppContext.tsx` initialization

- Ensure the migration reset (lines 163-168) does NOT override a valid RevenueCat entitlement. Move the RevenueCat check to happen AFTER the migration so it can re-enable Pro if the user has a valid purchase.
- This is already the case in the current code (RC check is on lines 170-179, after migration), so no change needed here.

### 4. Settings restore flow

- Already correct -- calls `restorePurchases()` then `checkProEntitlement()` as fallback.

## Technical Details

**Key change in ProUpgradeModal:**
```typescript
const rc = getRevenueCatInstance();
const result = await rc.presentPaywall({
  htmlTarget: paywallContainerRef.current,
  onBack: (closePaywall) => {
    closePaywall();
    onClose();
  },
});

// Check result directly
const hasPro = 'MeliusMe Pro' in result.customerInfo.entitlements.active;
if (hasPro) {
  setPro(true);
  toast.success('Welcome to MeliusMe Pro!');
  onClose();
}
```

**Cleanup on close:**
```typescript
useEffect(() => {
  if (!open && paywallContainerRef.current) {
    paywallContainerRef.current.innerHTML = '';
  }
}, [open]);
```

## Files to Edit

1. **`src/components/ProUpgradeModal.tsx`** -- Add `onBack` handler, improve result handling, add DOM cleanup
2. **`src/lib/revenuecat.ts`** -- No changes needed (existing code is correct)
3. **`src/contexts/AppContext.tsx`** -- No changes needed (initialization order is correct)
4. **`src/pages/Settings.tsx`** -- No changes needed (restore flow is correct)

