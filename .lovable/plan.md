

# Fix RevenueCat Paywall Font & Image Loading

## Problem
The RevenueCat-hosted paywall renders but its fonts are wrong and images don't load because the Content Security Policy in `index.html` blocks external font and image sources used by RevenueCat's paywall CDN.

Current restrictions:
- `font-src 'self' https://fonts.gstatic.com` — blocks RC paywall fonts
- `img-src 'self' data: blob: https://*.revenuecat.com https://*.stripe.com` — blocks RC paywall images hosted on CDNs
- `style-src 'self' 'unsafe-inline'` — may block RC external stylesheets

## Fix

**File: `index.html`** — Update CSP to allow RevenueCat paywall assets:

1. `font-src`: Add `https://*.revenuecat.com https://*.cloudfront.net https://fonts.googleapis.com` to allow paywall-hosted fonts
2. `img-src`: Add `https://*.cloudfront.net https://*.amazonaws.com https:` (or use `https:` broadly since paywall images come from various CDNs)  
3. `style-src`: Add `https://*.revenuecat.com` for any external stylesheets the paywall injects

The simplest robust approach: since the RevenueCat paywall is a third-party hosted UI that can load assets from multiple CDN origins, use `https:` for `img-src` and `font-src` to avoid whack-a-mole with individual CDN domains. This is safe because `default-src 'self'` still restricts scripts, connections, and frames.

Updated CSP line:
```
img-src 'self' data: blob: https:;
font-src 'self' https:;
style-src 'self' 'unsafe-inline' https:;
```

Everything else (script-src, connect-src, frame-src, default-src) stays unchanged.

## Scope
- **1 file changed**: `index.html` (CSP meta tag only)
- No design changes, no logic changes

