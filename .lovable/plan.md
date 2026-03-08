

# Plan: Set Up MeliusMe as a Native Android App with Capacitor

## What This Does
Wraps the existing MeliusMe web app in a native Android shell using Capacitor, enabling Play Store distribution and native features like RevenueCat in-app purchases.

## Steps

### 1. Install Capacitor Dependencies
Add `@capacitor/core`, `@capacitor/cli` (dev), and `@capacitor/android` as project dependencies.

### 2. Initialize Capacitor
Create `capacitor.config.ts` with:
- **appId**: `app.lovable.d46452db88a04d4ab43ff6c3a489f82a`
- **appName**: `meliusme`
- **server.url**: `https://d46452db-88a0-4d4a-b43f-f6c3a489f82a.lovableproject.com?forceHideBadge=true` (for live reload during development)
- **server.cleartext**: `true`

### 3. Local Setup (Your Machine)
After Lovable configures the project, you will need to:
1. Export to GitHub via Settings → GitHub
2. Clone and run `npm install`
3. Run `npx cap add android`
4. Run `npx cap update android`
5. Run `npm run build && npx cap sync`
6. Run `npx cap run android` (requires Android Studio)

### 4. RevenueCat Integration (Next Step)
Once the Capacitor shell is running, we can add the RevenueCat Capacitor plugin (`@revenuecat/purchases-capacitor`) to handle the $9.99 one-time Pro purchase natively through Google Play Billing — no Kotlin code needed, it works directly in TypeScript.

## Important Notes
- The app will hot-reload from the Lovable preview URL during development
- For production, remove the `server.url` to use the bundled app
- Android Studio is required on your machine to build and run

