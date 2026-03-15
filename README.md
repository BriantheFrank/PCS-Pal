# PCS-Pal
Website to help with the PCS process.

## Deployment
This repository is now transitioning to a Next.js App Router deployment on Vercel.
The repo still carries a legacy static multi-page app, but build-time sync copies the untouched
legacy `.html`, `.js`, and `.css` assets into `public/` so they keep working while native Next.js
routes are migrated in phases.

Current native Next.js public routes:
- `/`
- `/terms`
- `/privacy`
- `/about`
- `/contact`

Legacy `.html` aliases preserved through rewrites:
- `/index.html`
- `/terms-of-use.html`
- `/privacy-policy.html`

Legacy untouched routes still served as static bridge assets:
- `create-account.html`
- checklist / organizer / inventory / logistics
- guide articles
- base library and base detail pages

Legacy GitHub Pages/Jekyll and unused framework scaffolding have been removed.
Production deployments are expected to come from the `main` branch.
Current production URL: `https://pcs-pal-live.vercel.app/`

## Auth + Cloud Sync
See [README-auth.md](README-auth.md) for Supabase auth, sync architecture, setup, deployment, and smoke-test instructions.

## Migration Notes
- Next.js build config lives in `next.config.mjs`.
- Legacy bridge syncing lives in `scripts/sync-legacy-assets.mjs`.
- Route inventory and migration notes live in `docs/next-migration-foundation.md`.
