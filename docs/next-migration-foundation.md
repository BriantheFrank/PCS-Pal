# Next Migration Foundation

## What is implemented now
- Next.js App Router is scaffolded at the repo root.
- Native routes now exist for:
  - `/`
  - `/create-account`
  - `/checklist`
  - `/organizer`
  - `/inventory`
  - `/logistics`
  - `/bases`
  - `/bases/fort-liberty`
  - `/bases/fort-cavazos`
  - `/bases/fort-campbell`
  - `/bases/fort-bliss`
  - `/bases/fort-stewart`
  - `/bases/fort-belvoir`
  - `/bases/fort-meade`
  - `/bases/fort-riley`
  - `/bases/fort-jackson`
  - `/bases/fort-knox`
  - `/bases/fort-johnson`
  - `/bases/fort-drum`
  - `/bases/fort-sill`
  - `/bases/fort-leonard-wood`
  - `/bases/fort-moore`
  - `/bases/fort-eisenhower`
  - `/bases/fort-gregg-adams`
  - `/bases/fort-carson`
  - `/bases/fort-huachuca`
  - `/bases/joint-base-lewis-mcchord`
  - `/terms`
  - `/privacy`
  - `/about`
  - `/contact`
- Existing `.html` URLs for the migrated public pages are preserved through rewrites:
  - `/index.html`
  - `/create-account.html`
  - `/pcs-checklist.html`
  - `/move-organizer.html`
  - `/move-inventory.html`
  - `/move-logistics.html`
  - `/bases.html`
  - `/base-fort-liberty.html`
  - `/base-fort-cavazos.html`
  - `/base-fort-campbell.html`
  - `/base-fort-bliss.html`
  - `/base-fort-stewart.html`
  - `/base-fort-belvoir.html`
  - `/base-fort-meade.html`
  - `/base-fort-riley.html`
  - `/base-fort-jackson.html`
  - `/base-fort-knox.html`
  - `/base-fort-johnson.html`
  - `/base-fort-drum.html`
  - `/base-fort-sill.html`
  - `/base-fort-leonard-wood.html`
  - `/base-fort-moore.html`
  - `/base-fort-eisenhower.html`
  - `/base-fort-gregg-adams.html`
  - `/base-fort-carson.html`
  - `/base-fort-huachuca.html`
  - `/base-joint-base-lewis-mcchord.html`
  - `/terms-of-use.html`
  - `/privacy-policy.html`
- Only the remaining legacy guide pages and shared browser bridge assets are copied into `public/`
  at build time. Native route aliases now resolve through rewrites instead of shipped duplicate HTML.

## Legacy route bridge
Source of truth:
- `lib/legacy-route-manifest.mjs`

Build-time sync:
- `scripts/sync-legacy-assets.mjs`

The sync script copies the remaining legacy guide routes and shared bridge assets into `public/`
before `next dev` and `next build`.

Current copied legacy assets include:
- remaining guide `.html` routes only
- `styles.css`
- `auth-sync.js`
- `account-data.js`
- `checklist-data.js`
- `inventory-data.js`
- `logistics-data.js`
- `script.js`
- `bases-browser.js`
- `base-enhancements.js`
- `base-arrival-data.js`
- `pcs-reference-data.js`
- `legal-documents.js`

## Noindex protection during the bridge
To avoid making private legacy routes more indexable during migration:
- `next.config.mjs` applies `X-Robots-Tag: noindex, nofollow` to:
  - `/create-account.html`
  - `/create-account`
  - `/checklist`
  - `/organizer`
  - `/inventory`
  - `/logistics`
  - `/bases`
  - `/bases/:path*`
  - protected legacy tool pages
  - protected guide pages
- legacy guide pages and compatibility alias paths
  - `/app/:path*`
- `app/robots.txt/route.js` also disallows those paths.

This does not replace proper server-side protection for future `/app/*` routes. It is a migration
bridge safeguard.

## Runtime/API notes
- `app/api/public-config/route.js` mirrors the existing public runtime config endpoint.
- `app/api/legal-context/route.js` mirrors the existing legal-context hashing endpoint.
- Native auth pages now use a package-based browser Supabase client via:
  - `lib/supabase/browser-client.js`
  - `lib/supabase/use-browser-auth-session.js`
- The native create-account flow is implemented in:
  - `app/(public)/create-account/page.js`
  - `components/auth/create-account-form.js`
  - `lib/auth/create-account.js`

## Auth/account migration status
Now native:
- `/checklist`
- `/pcs-checklist.html` alias via rewrite
- `/organizer`
- `/move-organizer.html` alias via rewrite
- `/inventory`
- `/move-inventory.html` alias via rewrite
- `/logistics`
- `/move-logistics.html` alias via rewrite
- `/bases`
- `/bases.html` alias via rewrite
- `/bases/fort-liberty`
- `/bases/fort-cavazos`
- `/bases/fort-campbell`
- `/bases/fort-bliss`
- `/bases/fort-stewart`
- `/bases/fort-belvoir`
- `/bases/fort-meade`
- `/bases/fort-riley`
- `/bases/fort-jackson`
- `/bases/fort-knox`
- `/bases/fort-johnson`
- `/bases/fort-drum`
- `/bases/fort-sill`
- `/bases/fort-leonard-wood`
- `/bases/fort-moore`
- `/bases/fort-eisenhower`
- `/bases/fort-gregg-adams`
- `/bases/fort-carson`
- `/bases/fort-huachuca`
- `/bases/joint-base-lewis-mcchord`
- all twenty legacy `base-*.html` detail URLs now remain as compatibility aliases via rewrite
- `/create-account`
- `/create-account.html` alias via rewrite
- `/sign-in`
- `/account`
- native browser-side Supabase bootstrap for Next auth pages
- native signup validation and legal clickwrap handling
- native sign-in and logout on Next routes
- native top-bar account shell on Next routes
- native account settings page sections for:
  - identity
  - privacy settings
  - move profile
  - legal/compliance status
- shared account-data helpers in `account-data.js` used by both native pages and `auth-sync.js`
- native checklist route ownership with:
  - existing `pcs-checklist` localStorage key preserved
  - existing `user_checklist_state` remote sync shape preserved
  - existing `pcs-sync-initialized:<userId>` and `pcs-sync-backup:<userId>` compatibility preserved
  - checklist body sourced from the legacy HTML as a temporary content-compatibility shim
- native organizer route ownership with:
  - existing user-facing organizer entry path preserved through the `/move-organizer.html` rewrite
  - native links into the migrated inventory and logistics workspaces
  - no organizer-specific storage or Supabase sync semantics changed in this phase
- native inventory route ownership with:
  - existing `pcs-move-inventory` localStorage key preserved
  - existing `user_inventory` remote sync shape preserved
  - existing `pcs-sync-initialized:<userId>` and `pcs-sync-backup:<userId>` compatibility preserved
  - existing `/move-inventory.html` path preserved through rewrite compatibility
- native logistics route ownership with:
  - existing `pcs-move-logistics` localStorage key preserved
  - existing `user_move_logistics` remote sync shape preserved
  - existing itinerary stop and custom-event persistence semantics preserved
  - itinerary, custom-event, and directions handoff now rendered natively in React
  - existing `/move-logistics.html` path preserved through rewrite compatibility
- native bases route ownership with:
  - existing `/bases.html` entry path preserved through rewrite compatibility
  - base index search and state filtering reimplemented natively in React
  - base-card rendering now comes from structured native data instead of injected legacy DOM
  - outbound links now resolve directly to native `/bases/<slug>` detail routes
- native base detail template proof with:
  - shared structured data adapter reading the legacy detail content into a reusable native render model
  - shared native detail template now used by Fort Liberty, Fort Cavazos, Fort Campbell, Fort Bliss, Fort Stewart, Fort Belvoir, Fort Meade, Fort Riley, Fort Jackson, Fort Knox, Fort Johnson, Fort Drum, Fort Sill, Fort Leonard Wood, Fort Moore, Fort Eisenhower, Fort Gregg-Adams, Fort Carson, Fort Huachuca, and Joint Base Lewis-McChord
  - arrival/reporting and helpful first-week sections rendered natively from `base-arrival-data.js`
  - sponsored placement block rendered natively for the migrated pages instead of depending on legacy DOM injection
  - legacy base-detail HTML URLs are compatibility aliases only; the canonical detail ownership path is `/bases/<slug>`

Still legacy:
- protected route enforcement for the remaining bridged pages
- guide pages only
- legacy account dropdown rendering on bridged pages only
- landing-page/tool sync, analytics, partner-placement, and protected-route logic inside `auth-sync.js`

Temporary coexistence:
- native Next pages no longer load `auth-sync.js` from the root layout
- native auth/account pages use `@supabase/supabase-js` through:
  - `components/auth/native-auth-provider.js`
  - `lib/supabase/browser-client.js`
- legacy bridged pages still use the existing CDN-loaded Supabase client inside `auth-sync.js`
- legacy and native account settings now share the same account/profile/legal data operations through
  `account-data.js`
- legacy and native checklist flows now share the same checklist sync/storage helper through
  `checklist-data.js`
- legacy and native inventory flows now share the same inventory sync/storage helper through
  `inventory-data.js`
- legacy and native logistics flows now share the same logistics sync/storage helper through
  `logistics-data.js`
- both paths continue to rely on the same `/api/public-config` and `/api/legal-context` endpoints
- native pages render their own top bar, mobile nav, account shell, and footer legal links through
  `components/site/chrome.js`

## Environment variables
Existing:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_ENABLE_GOOGLE_AUTH`
- `LEGAL_IP_HASH_SALT`

New optional SEO/runtime setting:
- `NEXT_PUBLIC_SITE_URL`

If `NEXT_PUBLIC_SITE_URL` is not set, the current fallback is `https://pcs-pal-live.vercel.app`.
The native `/logistics` page now provides a Google Maps directions handoff without embedding the old client-side route-planning runtime.

## What remains for later phases
- replace the checklist content shim with fully componentized checklist content when that becomes worth the migration risk
- migrate the remaining guide and base-detail content families into structured Next.js templates
- remove the legacy bridge after route parity is complete
- decide whether `/account` should move to a server-guarded auth boundary after the tool migration


