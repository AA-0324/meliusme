
# Ship MeliusMe as an Android TWA

A TWA (Trusted Web Activity) is just Chrome-on-Android rendering your live site inside an Android app shell, signed and published to Play. There is no WebView bridge, no Median, and no injected `window.median`. Everything runs as a real PWA under Chrome, which means:

- Camera + gallery use the standard web APIs (`getUserMedia`, `<input type="file" capture>`). Chrome prompts for permission the first time, exactly like in the browser. No native plugin needed.
- RevenueCat Web SDK + Stripe checkout work as-is, because it's Chrome under the hood. (Note: Play Store policy still requires Google Play Billing for digital goods in apps distributed on Play — this is a policy risk, not a code bug. Sideloading or distributing outside Play avoids it.)
- No push notifications, so no service worker messaging setup needed.

The app is already ~90% ready. This plan removes the Median-specific scaffolding (dead weight for a TWA), makes the site a valid installable PWA (required for TWA — Chrome verifies the manifest), and produces the digital asset link file Play needs to verify domain ownership.

## Scope

**In scope (code):**
1. Remove Median bridge code + CSP allowances (unused in TWA, and `'unsafe-eval'` in CSP is a security smell we no longer need).
2. Add a minimal PWA manifest (`manifest.webmanifest`) with `display: standalone`, name, theme color, and 192/512 icons. Required for TWA verification.
3. Add matching `<link rel="manifest">`, `apple-touch-icon` is irrelevant (Android-only), keep `theme-color`.
4. Add `.well-known/assetlinks.json` in `public/` as a template so Play can verify your domain ↔ app signature. Values (package name, SHA-256 cert fingerprint) get filled in when you generate the TWA via Bubblewrap or PWABuilder.
5. Tighten `<input type="file">` in `Camera.tsx` — add `capture="environment"` on the gallery fallback so Android offers the camera as a source too, and confirm the accept type is `image/*` (already is).
6. Leave RevenueCat Web SDK untouched. Add a short doc note about the Play Billing policy risk so it's not a surprise later.

**Out of scope:**
- Service worker / offline caching (not needed for TWA to work; TWA runs online).
- Push notifications (user said no).
- iOS anything.
- Median bridge (deleting).
- Capacitor / native project (TWA is a different path — no `npx cap add`).

## Files touched

- `index.html` — drop `'unsafe-eval'` and Median CSP entries; add `<link rel="manifest" href="/manifest.webmanifest">`; keep `viewport-fit=cover` and `theme-color`.
- `src/main.tsx` — remove `initMedianBridge()` import + call.
- `src/components/Camera.tsx` — remove `isMedianEnvironment` / `medianPickImage` usage; simplify `handleMediaCapture` back to pure web path; add `capture="environment"` to the file input.
- `src/lib/median.ts` — delete.
- `public/manifest.webmanifest` — new. Standard fields, `display: standalone`, `start_url: "/"`, `scope: "/"`, `background_color: #0a0f1a`, `theme_color: #0a0f1a`, icons 192 + 512.
- `public/icons/icon-192.png`, `public/icons/icon-512.png` — new. Generated from the existing MeliusMe mark. Maskable-safe padding.
- `public/.well-known/assetlinks.json` — new, template with placeholder `package_name` and `sha256_cert_fingerprints`.
- `src/pages/Settings.tsx` — bump `BUILD_NUMBER` to 117.
- `package.json` — no version bump (still 1.0.0).
- `README.md` — short "Publishing as an Android TWA" section documenting the Bubblewrap/PWABuilder flow and the Play Billing caveat.

## How you actually ship it (after this pass)

Not code — reference for you:

1. Publish the Lovable site (production URL, e.g. `meliusme.lovable.app` or a custom domain).
2. Run [PWABuilder](https://www.pwabuilder.com/) against that URL, or use `bubblewrap init --manifest=https://your-domain/manifest.webmanifest`.
3. It generates a signed Android project. Take the SHA-256 fingerprint it produces, paste it into `public/.well-known/assetlinks.json`, redeploy.
4. Upload the resulting `.aab` to Play Console.

## Technical notes

- **Why drop `'unsafe-eval'`:** it was added for the Median bridge script. RevenueCat Web SDK and Stripe.js don't need `eval`. Removing it reduces XSS blast radius and won't break anything we tested.
- **Why keep CSP wildcard `connect-src *`:** RevenueCat + Stripe span multiple hosts and change over time; narrowing this can be a follow-up but isn't required for TWA.
- **File input `capture` attribute:** on Android Chrome, adding `capture="environment"` lets users pick "Camera" from the file chooser sheet even without `getUserMedia`. This is the reliable fallback if a user denies camera permission but still wants to snap a photo.
- **RevenueCat in TWA:** the Chrome Custom Tab that TWA uses shares cookies with the user's Chrome, so Stripe checkout redirects work. Anonymous RevenueCat user IDs persist in IndexedDB the same as in the browser.
- **Play Billing risk:** Google's Payments policy requires Play Billing for in-app digital purchases when distributed via Play. TWAs are not exempt. Options later: (a) hide Pro upgrade in the TWA build via a build flag, (b) integrate Play Billing through Digital Goods API, or (c) distribute outside Play (APK on your site). We won't decide this now — just flagging it.

## Deliverable

After this pass the site is a valid installable PWA, ready for Bubblewrap/PWABuilder to wrap into a signed Android TWA with only the camera + storage permissions Chrome auto-requests. Median scaffolding is gone.
