🥗 MeliusMe

**MeliusMe** is a minimalist nutrition and meal-tracking application designed to give users total ownership over their health data. By eliminating cloud dependencies, accounts, and ads, MeliusMe provides a high-performance, private-by-default experience for users serious about a better life.

**Current Progress:** Vibe-Coded Prototype - Estimated 75% finished

## Features
- **Zero Friction Logging:** Rapid, intuitive entry system to reduce tracking fatigue.
- **Privacy First:** All data is stored locally on-device. No accounts, no tracking.
- **Goal-Aware Tools:** Integrated logic for bulking, cutting, and maintenance phases.
- **Insights:** Clear, actionable progress visualization without unnecessary complexity.

## Stack
- **Frontend:** TypeScript, CSS
- **Backend:** IndexedDB, localStorage
- **Payments Provider:** RevenueCat (soon to be implemented)
- **Prototyping:** Iterative Vibe-Coding
- **Scripting:** TypeScript, CSS (might be updated as MeliusMe continues to develop)

Behind The Scenes
- **Cybersecurity:** I am dedicated to delivering a finished product with secure local storage and data encryption to make sure user privacy is uncompromised. By purposefully eliminating any use of the cloud, I am ensuring that users' private information remains private and that it all remains under the users' control, protecting their info from external vulnerabilities and unauthorized access.
- **Data Analytics:** Coding the app is only 40% of the process. Before starting the code, I researched and analyzed mobile app niches that had significant growth over the past year, a growing userbase, and good potential (and made sure it wasn't just an outlier). After that, I further analyzed nine of the top apps in the niche I chose to find problems and issues that my app could set out to fix. I repeated this process multiple times until eventually, I stumbled across the nutrition-tracking niche. That will not be all, however. In order to market MeliusMe, I must analyze market trends and user behavior. These insights will help us come up with a targeted marketing strategy meant to market MeliusMe to a wide, diverse, global audience.
- **Programming:** I cannot simply 'copy and paste' the Lovable code. I'm perusing through it, making sure that I understand every line of code, its reason for being there, tweaking it, and learning along the way. I think that anyone can type a prompt into any vibe-coding website and come out with an app eventually, but in order to really 'own' your work, you *must* go through it and understand each line of code.

Developing Methodology
MeliusMe was developed using an iterative, AI-assisted vibe-coding workflow. Doing this allowed me to focus on high-level system architecture, product logic, and user experience while utilizing AI agents like Lovable to handle the frontend scaffolding. This modern development cycle allows for much faster prototyping and makes sure that the focus remains on solving nutritional data challenges rather than boilerplate syntax.
I did not start this project half-baked. I researched for around 3 weeks, using articles, forums, videos, and real-life examples to see what to do and what not to do. While doing this, I came across Zero-Trust review processes. I decided to implement an altered version of them into my use of vibe-coding, so now I continuously perform manual 'audits' of all AI-generated logic.

**Ideal Deadline: December 31, 2026**

## Publishing as an Android TWA (Trusted Web Activity)

MeliusMe is a PWA and ships to Google Play as a TWA — Chrome-on-Android renders the live site inside a signed Android shell. No native code, no Median wrapper.

### Steps
1. Publish the site to a production HTTPS URL (e.g. `meliusme.lovable.app` or a custom domain).
2. Generate the Android project:
   - Easiest: [PWABuilder](https://www.pwabuilder.com/) — paste the URL, download the Android package.
   - Or CLI: `bubblewrap init --manifest=https://YOUR_DOMAIN/manifest.webmanifest`, then `bubblewrap build`.
3. The generator produces a signed `.aab` and a **SHA-256 signing key fingerprint**.
4. Open `public/.well-known/assetlinks.json` and replace:
   - `REPLACE_WITH_ANDROID_PACKAGE_NAME` with the app's package (e.g. `app.meliusme.twa`).
   - `REPLACE_WITH_APP_SIGNING_KEY_SHA256_FINGERPRINT` with the fingerprint from step 3.
5. Republish the site so `https://YOUR_DOMAIN/.well-known/assetlinks.json` is live.
6. Upload the `.aab` to Google Play Console.

### Permissions
Chrome auto-requests camera and photo access the first time the user opens the log screen. No permission declarations required on the TWA side.

### Play Billing note
Google Play's payments policy requires **Play Billing** for digital in-app purchases when distributed via Play. RevenueCat Web + Stripe checkout is compliant when distributed outside Play (direct APK) but may be rejected on Play. Options later: integrate the Digital Goods API + Play Billing, hide Pro in the TWA build, or distribute the APK outside Play.

