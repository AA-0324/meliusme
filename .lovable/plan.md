

# Force Green Colors on RevenueCat Paywall Elements

## Problem
Despite theme isolation efforts, app CSS custom properties (like `--primary` which changes per theme) still cascade into the RevenueCat paywall DOM, turning green buttons/text red or other theme colors.

## Solution
Inject a scoped `<style>` tag into the paywall container after the SDK renders, forcing the correct green (`#1ebc73`) on the key elements. Use a `MutationObserver` to detect when RevenueCat finishes rendering and apply overrides.

## Changes

**File: `src/components/ProUpgradeModal.tsx`**

1. Add a `useEffect` that watches the paywall container with a `MutationObserver`
2. Once children are added (paywall rendered), inject a `<style>` element that overrides:
   - CTA / "Upgrade now" button background to `#1ebc73`
   - "Terms", "Privacy", "MeliusMe" link text to `#1ebc73`
   - Any accent-colored text to `#1ebc73`
3. Target RevenueCat's known CSS classes/selectors (e.g., `button`, `a`, and RC-specific class patterns) with `!important` rules
4. Disconnect the observer once styles are injected

This brute-force approach bypasses the CSS variable cascade entirely by applying inline-level overrides directly inside the paywall's rendered DOM.

