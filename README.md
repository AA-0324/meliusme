# MeliusMe

MeliusMe is a privacy-first nutrition and meal-tracking app. It is built local-first: your meals, goals, streaks and profile are stored and processed on your own device, not on a server. There are no accounts, no ads, and no analytics pipeline collecting your health data.

Intended distribution target: Google Play, as an Android Trusted Web Activity (TWA).

## Product purpose

Most nutrition apps ask for an account before showing a single screen, then treat detailed dietary data as a business asset. MeliusMe takes the opposite position: tracking should be fast, private, and fully owned by the person doing it. The feature set is deliberately narrow — log a meal in seconds, see where the day stands, keep momentum.

The product direction came from a research pass over the nutrition-tracking category: reviewing competing apps, their reviews, and the recurring complaints (tracking fatigue, aggressive paywalls, forced accounts, guilt-driven copy). Those findings shape the design: zero-friction logging, neutral non-judgmental language around goals, and a free core that stays usable without a purchase.

## Features

- **Zero-friction logging** — photo, calories, macros, meal type; no account, no sync wait.
- **Daily dashboard** — calories, protein, fiber, sugar and water against your own targets, with a nutrition score and progress rings.
- **Streaks, levels and daily challenges** — local gamification, including time-limited unlocks of individual Pro features as rewards.
- **Goal-aware guidance** — bulking, cutting and maintenance phases, with body-profile-derived targets.
- **CSV export** — your full meal history, exportable at any time, free.
- **Themes and dark mode**.

## Architecture

### Local-first storage

- **IndexedDB** (`idb`) holds meals, settings, goals, water intake, XP/streak state and the encryption keystore.
- No cloud database, no server-side copy of user data. The core experience works fully offline.

### Encryption

- Meal records and sensitive settings are encrypted with **AES-GCM (256-bit)** via the Web Crypto API before being written to IndexedDB.
- The master key is generated on device and stored in a separate IndexedDB keystore; it never leaves the device.
- Every write is verified by decrypting the ciphertext before it is committed, so a record is never persisted in a form the app cannot read back.
- This protects data at rest against casual inspection of browser storage. It is not a defence against an attacker who already controls the device, and MeliusMe does not claim otherwise. See `SECURITY.md`.

### Migrations and error handling

- Installs that predate encryption are migrated in place. Encryption happens *before* the write transaction opens, because awaiting non-IndexedDB work inside a transaction lets the browser auto-close it mid-migration.
- Migration is fail-safe: a record that cannot be encrypted and verified is left exactly as it was. A failed migration never deletes or overwrites user data.
- Records that cannot be decrypted or that no longer match the expected shape are skipped at read time rather than crashing the app, and a failed database open degrades to an empty read instead of a blank screen.

### Date semantics

All user-facing days — meal dates, streaks, daily challenges, water resets — are **local calendar days**. Date keys are produced by a single helper module rather than `toISOString()`, which would silently shift the day boundary for anyone outside UTC. Day arithmetic uses calendar-day differences, so DST transitions do not add or drop a day.

### Performance

- Encrypted rows cannot be indexed by date without persisting plaintext metadata, which would weaken the encryption model. Instead each row is decrypted at most once into a bounded in-memory cache, so ordinary dashboard operations scan plaintext in memory rather than repeating AES-GCM work across the whole history.
- The cache is size-capped (meals carry photo data URLs) and evicts oldest-first, so large histories degrade gracefully rather than growing memory without bound.
- Routes are code-split with `React.lazy`, and dashboard aggregation runs over memoised date-indexed maps.

### Pro entitlements

- **RevenueCat** (`@revenuecat/purchases-js`) is the active integration for the one-time Pro purchase. Subscriptions are not used.
- There is a single entitlement abstraction. RevenueCat is authoritative whenever it can be reached; otherwise the last verified answer is used from an encrypted local cache, within a bounded grace period, so a purchase keeps working offline. Only a *verified* negative answer revokes Pro.
- The client uses the RevenueCat public SDK key, read from `VITE_REVENUECAT_PUBLIC_KEY`. No secret keys are present in client code.
- Pro state is UX gating, not a security boundary: everything runs on device and there is no server to protect. Free functionality — including access to and export of your own data — never depends on entitlement state or on network availability.

## Testing

Vitest with `fake-indexeddb` covers the domain and persistence layers rather than shallow render assertions: encryption/decryption round-trips, IndexedDB persistence and CRUD, migration and corrupt-record handling, CSV export escaping, local-date behaviour, nutrition aggregation, goal feedback, streak/level/challenge logic, and entitlement resolution (verified, cached, stale, offline).

```bash
bun install
bun run dev            # local dev server
bunx vitest run        # test suite
bun run build          # production build
```

## Engineering and product development

MeliusMe is developed with an AI-assisted workflow (Lovable) for frontend scaffolding, with architecture, data model, security model and product decisions reviewed and directed by the author. All AI-generated logic is reviewed before it lands.

## Public site metadata

- `index.html` carries the title, description, canonical, Open Graph/Twitter tags and JSON-LD (Organization, WebSite, WebApplication).
- `public/sitemap.xml` is generated by `scripts/generate-sitemap.ts` (wired to `predev`/`prebuild`) and lists only the public landing route; the in-app screens (`/log`, `/dashboard`, `/profile`, `/settings`, `/challenges`) are disallowed in `public/robots.txt`.
- The site origin defaults to `https://meliusme.lovable.app` and can be overridden with the `VITE_SITE_URL` environment variable (see `src/config/site.ts`; the sitemap script reads the same variable).
- **External step:** Google Search Console verification requires a token Google generates for the property. Paste it into the documented placeholder in the `<head>` of `index.html` (or use the DNS method). No verification value is committed here.

## Android / Google Play


- Ships as a Trusted Web Activity: web manifest, brand icons and a `.well-known/assetlinks.json` for Digital Asset Links verification.
- No push notifications. Camera and photo access are requested by the browser on first use; no additional TWA permission declarations are required.
- Remaining external setup, which cannot live in this repository: the Android package name and app-signing SHA-256 fingerprint in `assetlinks.json`, the production RevenueCat public key, and RevenueCat/Google Play product and entitlement configuration. Google Play requires Google Play Billing for digital goods, so the Pro purchase path must be wired through Play Billing before a store release.

## License

See `LICENSE`.
