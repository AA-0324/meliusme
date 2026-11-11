# MeliusMe Security

_Last reviewed: November 10, 2026_

This document describes security-relevant behavior visible in the current public source code. It is an implementation note, not a guarantee that the application is free of vulnerabilities or a certification of compliance.

## Data storage and encryption

MeliusMe is a local-first application. The current source does not implement a Melius-operated account service, cloud database, or meal/profile synchronization endpoint. Core meal, photo, profile, goal, water, settings, and progress records are stored in browser/app storage on the user's device.

New meal records are serialized and encrypted before being written to IndexedDB. Other app values written through `src/lib/encryptedStorage.ts` are also encrypted before being written to IndexedDB.

The current encryption implementation in `src/lib/crypto.ts` uses:

- **Algorithm:** AES-GCM.
- **Key size:** 256 bits.
- **Initialization vector:** a fresh random 12-byte IV is generated for each encryption operation and stored with the ciphertext.
- **Key generation:** Web Crypto `crypto.subtle.generateKey()`, with `extractable: false` and encrypt/decrypt usages.
- **Key storage:** the non-extractable `CryptoKey` is stored in IndexedDB in a separate database (`melius-keystore`), not in localStorage.
- **Write verification:** the application decrypts newly encrypted values and compares them with the original before committing the write.

Meal ciphertext is stored in the `melius-db` IndexedDB database. Other encrypted values are stored in `melius-secure-storage`. A meal photo, when saved with a meal, is included in the encrypted meal payload.

### Legacy data and migration

The application includes migration code for installations that stored data before encryption was introduced. It attempts to encrypt legacy localStorage values and legacy plaintext meal rows. The original localStorage value is removed only after the encrypted value has been written and read back successfully. If migration or verification fails, the original value is intentionally retained so that a failed migration does not destroy user data.

**Do not claim that every record on every existing installation is encrypted.** Older or failed-to-migrate records may remain in plaintext. The application also includes backward-compatible reads for some legacy meal records.

### Limits of the encryption model

The encryption key is stored on the same device and app origin as the encrypted data. There is no user-supplied passphrase or separate recovery key, and this implementation is not described as hardware-backed encryption. The non-extractable CryptoKey setting prevents ordinary key export through the Web Crypto API; it does not protect data from an attacker who controls the device, can access the browser profile, or can execute script in the app's origin and invoke the key.

Decrypted meal data is held in application memory while in use. The meal layer maintains a bounded in-memory cache of up to 400 decrypted meal records. Local encryption should therefore be understood as protection against casual inspection of stored records, not protection against a compromised device, an active unlocked session, malicious same-origin code, or all forms of forensic access.

## Network activity and third-party services

The current source has no Melius-operated API endpoint for uploading meal logs, profile values, or saved food photos. The current source also does not include an advertising SDK, in-app analytics SDK, or crash-reporting SDK. Food photos are processed in the browser and are not sent to a remote food-recognition service by the current implementation.

There are two important network exceptions:

1. **Hosting:** the web application and public policy pages are served by hosting providers. Those providers may process IP addresses, browser/device details, requested resources, timestamps, and security logs as part of delivering and protecting the pages.
2. **RevenueCat:** the project includes `@revenuecat/purchases-js`. The application attempts to initialize RevenueCat at startup. If `VITE_REVENUECAT_PUBLIC_KEY` is not configured, the integration returns without configuring the SDK. When a key is configured and purchase-related functionality is used, the SDK communicates with RevenueCat and may send an anonymous App User ID, device/browser technical information, and purchase/entitlement information. The current application code does not pass meal records, food photos, body-profile fields, or nutrition goals to RevenueCat. A checkout provider or app-store provider may separately handle payment and transaction information.

The generated RevenueCat App User ID is stored locally through the encrypted-storage wrapper. There is no MeliusMe account system to link that identifier to a cross-device identity.

## Camera and photo handling

`src/components/Camera.tsx` requests camera video through `getUserMedia` with `audio: false`. The user can also select a photo using the file picker. A selected image is processed in the browser and is stored locally only if the user saves it with a meal.

The current camera code does not request microphone access. The current source does not call geolocation or contacts APIs.

## Content Security Policy: Current Limitation

The Content Security Policy (CSP) is declared using a `<meta http-equiv="Content-Security-Policy">` element in `index.html`.

It is **not a strict origin allowlist**. The current policy includes these directives:

    default-src 'self' https:
    script-src 'self' 'unsafe-inline' https://js.stripe.com
    style-src 'self' 'unsafe-inline' https:
    img-src * data: blob:
    media-src * data: blob:
    font-src 'self' data: https:
    object-src 'none'
    base-uri 'self'
    frame-ancestors 'self'
    form-action 'self'
    connect-src * data: blob:
    frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://*.stripe.com

In particular:

- `script-src` allows inline scripts through `'unsafe-inline'` and allows the Stripe.js origin.
- `connect-src *` allows connections to any origin, rather than a limited host allowlist.
- `img-src *` and `media-src *` allow resources from any origin.
- The policy allows HTTPS resources broadly through `default-src`, as well as the explicitly listed sources.
- Because the policy is delivered through a meta element, directives that are only enforceable as HTTP response headers (including `frame-ancestors`) are not enforced by that meta policy.

These settings reflect the current source and should not be described as a **strict CSP**.

A future hardening pass should identify the exact origins required by the deployed hosting and purchase flow, narrow the source lists, remove inline-script allowances where feasible, and deliver header-only directives through hosting response headers.

## Vulnerability Reporting

Please report suspected security vulnerabilities privately by email to **akshararvind5@gmail.com** rather than posting exploit details in a public issue.

When reporting a concern, include:

- The affected feature.
- Potential impact.
- Clear reproduction steps, where possible.

Do not include real users' personal information, access or modify another person's data, or disrupt the service while testing.

Please allow a reasonable period for investigation and remediation before public disclosure. No fixed response or remediation deadline is promised.

## Scope and Limitations

This document describes the current repository implementation.

It does not certify the security of third-party hosting, RevenueCat, payment processors, app stores, browser engines, operating systems, or future Android wrappers.

Their own security and privacy practices are governed by their respective documentation.

Security properties should be re-reviewed whenever storage, CSP, purchase, hosting, or distribution code changes.
