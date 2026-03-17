# PCS-Pal

Website to help with the PCS process.

## Deployment
This repository now deploys as a native Next.js App Router application on Vercel.
The primary user-facing routes are owned by Next.js, and legacy `.html` URLs are kept only as
compatibility redirects where they still help preserve old entry points.

Current native Next.js routes include:
- `/`
- `/create-account`
- `/sign-in`
- `/account`
- `/checklist`
- `/guides/[slug]`
- `/organizer`
- `/inventory`
- `/logistics`
- `/bases`
- `/bases/<slug>`
- `/terms`
- `/privacy`
- `/about`
- `/contact`

Legacy `.html` aliases preserved through redirects include:
- `/index.html`
- `/create-account.html`
- `/pcs-checklist.html`
- the five checklist guide article `.html` URLs
- `/move-organizer.html`
- `/move-inventory.html`
- `/move-logistics.html`
- `/bases.html`
- all migrated `base-*.html` detail URLs
- `/terms-of-use.html`
- `/privacy-policy.html`

Legacy GitHub Pages/Jekyll and the runtime HTML bridge have been retired from the build path.
Production deployments are expected to come from the `main` branch.
Current production URL: `https://pcs-pal-live.vercel.app/`
Key crawl files are served by the App Router at `/robots.txt` and `/sitemap.xml`.

## Auth + Cloud Sync
See [README-auth.md](README-auth.md) for Supabase auth, sync architecture, setup, deployment, and smoke-test instructions.

## Migration Notes
- Next.js build config lives in `next.config.mjs`.
- Route inventory and migration notes live in `docs/next-migration-foundation.md`.
- Checklist and guide content now render through structured data adapters under `lib/checklist/` and `lib/guides/`.
