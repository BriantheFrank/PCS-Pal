# Next Migration Foundation

## What is implemented now
- Next.js App Router owns the primary PCS-Pal experience at the repo root.
- Native routes now exist for:
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
  - `/bases/<slug>` for all twenty base detail pages
  - `/terms`
  - `/privacy`
  - `/about`
  - `/contact`
- Existing legacy `.html` entry points for those pages are preserved through rewrites only:
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
- Build-time public copying of legacy HTML has been removed from the normal `dev` and `build` flow.

## Route and content ownership
- `lib/legacy-route-manifest.mjs` is now the source of truth for compatibility rewrites and noindex headers.
- `next.config.mjs` applies those rewrites before files so old `.html` entry points resolve to the native App Router routes.
- `app/checklist/page.js` now renders the checklist natively from structured data produced by `lib/checklist/page-data.js`.
- `app/guides/[slug]/page.js` now renders the five checklist article pages natively from structured data produced by `lib/guides/page-data.js`.
- `app/bases/[slug]/page.js` continues to own all base detail pages through the shared native base-detail template and data adapter.

## Current native ownership
Now native:
- checklist route ownership, checklist UI, checklist local storage, and checklist remote sync
- five checklist guide article routes under `/guides/[slug]`
- organizer, inventory, and logistics move workspaces
- base index and all base detail pages
- landing, legal, support, account, and auth pages

Compatibility only:
- old `.html` URLs now exist as rewrite aliases, not as shipped runtime HTML pages
- source HTML files remain in the repo where they are still being used as content inputs for structured data adapters

## Noindex protection during migration
To avoid making protected or compatibility-only paths indexable during migration:
- `next.config.mjs` applies `X-Robots-Tag: noindex, nofollow` to:
  - compatibility `.html` aliases
  - `/create-account`
  - `/checklist`
  - `/guides/:path*`
  - `/organizer`
  - `/inventory`
  - `/logistics`
  - `/bases`
  - `/bases/:path*`
  - `/app/:path*`
- `app/robots.txt/route.js` also disallows those paths.

## Runtime/API notes
- `app/api/public-config/route.js` mirrors the existing public runtime config endpoint.
- `app/api/legal-context/route.js` mirrors the existing legal-context hashing endpoint.
- Native auth pages use:
  - `components/auth/native-auth-provider.js`
  - `lib/supabase/browser-client.js`
  - `lib/supabase/use-browser-auth-session.js`
- Shared browser-side storage and Supabase sync helpers still live in:
  - `account-data.js`
  - `checklist-data.js`
  - `inventory-data.js`
  - `logistics-data.js`

## What remains for later phases
- replace the remaining legacy source-file adapters with first-class native content modules if that becomes worth the editorial effort
- decide whether `/account` and the protected tool routes should move to a server-guarded auth boundary
- remove obsolete legacy source files and reference-only scripts once the team no longer needs them for rollback or content extraction
