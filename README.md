# WrenchWHY? — Auto repair booking (Phase 1 scaffold)

## Honest status
**Done:** Vite/React/TS/Tailwind app, fiery homepage (flames, floating "?", swinging wrench, reduced-motion support), register/login with Firebase Auth, pending-approval gate, Firestore + Storage security rules, Cloud Functions for profile creation, admin approval, and a transactional booking with overlap check.
**NOT done yet (needs further build phases):** admin dashboard UI, mechanic/service management pages, calendars, availability slot generation (shop hours/shifts/breaks/leave), booking UI, PayMongo + webhook verification, QR generation/scanner, Brevo emails + templates, PDF receipts, reminders, search, reports, job orders, reviews, expiry cleanup of holds. Nothing here is a working payment or email integration.

## Setup
1. `npm install && (cd functions && npm install)`
2. Create a Firebase project (Auth email/password, Firestore, Storage, Functions on Blaze plan). Copy `.env.example` to `.env` and fill the web config. Edit `.firebaserc`.
3. `npm run dev`; emulators: `npm run emulators`.
4. Deploy: `npm run build && firebase deploy`.

## First admin
Never via the app. Create the user in Firebase Console, then run once with a service account:
`admin.auth().setCustomUserClaims(UID,{admin:true})` and create `users/UID` with role "admin", approvalStatus "approved".

## Secrets
Set Brevo/PayMongo keys with `firebase functions:secrets:set`. Never put them in VITE_ variables.
