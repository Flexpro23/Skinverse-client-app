# SkinVerse Clinic - Client App

Production-ready Vite + React + TypeScript app configured for Vercel deployment.

## Local Development

1. Install dependencies:
   - `npm install`
2. Create `.env` from `.env.example` and fill values:
   - `cp .env.example .env`
3. Start dev server:
   - `npm run dev`

## Build

- `npm run build` → outputs to `dist/`
- `npm run preview` → local preview of production build

## Environment Variables

Configure these in `.env` (and in Vercel Project Settings → Environment Variables):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_GEMINI_API_KEY`

## Vercel Deployment

- Repo is ready with `vercel.json`:
  - `buildCommand`: `npm run build`
  - `outputDirectory`: `dist`
  - SPA routing fallback to `index.html`
- `package.json` sets Node engines `>=18`.
- Import the GitHub repo into Vercel, set the env vars above, and Deploy.

## Notes

- Uses Firebase Web SDK v12; Firestore uses `experimentalForceLongPolling` for broader network compatibility.
- Media processing handled via MediaPipe with performance-conscious loops.
