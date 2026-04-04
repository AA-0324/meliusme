

# Fix ProUpgradeModal Visual Issues

## Problems Identified

From the screenshot:
1. **Two X buttons** — Our modal renders its own close button (line 103-109), but RevenueCat's paywall also renders one via `onBack`. Result: duplicate close buttons.
2. **Loading spinner overlapping paywall** — The spinner (line 112-120) renders at `z-[201]` on top of the paywall content even after the paywall has started rendering, because `isLoading` stays `true` until `presentPaywall` fully resolves (which only happens after a purchase or dismissal).
3. **Background/color conflicts** — The modal wrapper has `bg-black/90 backdrop-blur-xl` which darkens/blurs behind the paywall. The RevenueCat paywall has its own background, so these layer and cause the washed-out look.
4. **Layout conflict** — The wrapper uses `flex items-center justify-center` which fights with RevenueCat's own full-height layout.

## Fix

**File: `src/components/ProUpgradeModal.tsx`**

The modal should be a minimal full-screen container that just hosts the RevenueCat paywall — no extra UI chrome:

1. **Remove the custom close button** — RevenueCat's paywall has its own back/close button wired via `onBack`
2. **Remove the loading spinner** — or hide it once `presentPaywall` is called (not when it resolves). The paywall SDK handles its own loading state internally.
3. **Simplify the wrapper** — Use a plain `fixed inset-0` container with no background color, no backdrop blur, no centering. Let the RevenueCat paywall own the entire viewport.
4. **Keep error state** — Only show our custom UI if the offering validation fails before the paywall even renders.

```text
Before:
┌─────────────────────────┐
│ bg-black/90 + blur      │
│  ┌───────────────────┐  │
│  │ [X] (ours)        │  │
│  │ [spinner overlay]  │  │
│  │ ┌───────────────┐  │  │
│  │ │ RC Paywall    │  │  │
│  │ │ [X] (theirs)  │  │  │
│  │ └───────────────┘  │  │
│  └───────────────────┘  │
└─────────────────────────┘

After:
┌─────────────────────────┐
│ RC Paywall (full screen)│
│ [X] (theirs via onBack) │
│                         │
│ ...paywall content...   │
└─────────────────────────┘
(error state only if validation fails)
```

## Scope
- **1 file**: `src/components/ProUpgradeModal.tsx`
- Remove close button, spinner, dark background
- Keep error/retry state for pre-paywall failures
- Keep cleanup logic and entitlement check on success

