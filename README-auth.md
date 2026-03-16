# PCS-Pal Auth + Cloud Sync

## Architecture Summary
PCS-Pal now has a Next.js App Router shell at the repo root, with a legacy static bridge for
unmigrated pages.

Additive components:
- `app/`: Next.js App Router public shell, route handlers, robots, and sitemap
- `auth-sync.js`: browser auth and data sync layer
- `account-data.js`: shared account/profile/legal Supabase operations used by native and legacy auth flows
- `api/public-config.js`: Vercel serverless endpoint exposing public runtime config
- `api/legal-context.js`: Vercel serverless endpoint exposing minimal request metadata for legal evidence capture
- `legal-documents.js`: shared current legal document metadata for public pages and signup UX
- `scripts/sync-legacy-assets.mjs`: build-time sync of the remaining legacy guide pages and shared bridge assets into `public/`
- `lib/legacy-route-manifest.mjs`: source of truth for legacy route rewrites and noindex headers
- `supabase/migrations/20260309000100_pcs_pal_auth_and_user_data.sql`: schema and RLS setup

Native Next.js routes now cover the landing/trust pages plus the checklist, organizer, inventory,
logistics, the base index, and all native base detail routes. The remaining legacy runtime surface
is now limited to guide pages and shared bridge assets that still support those guides.

## Native vs Legacy Auth Status
Now native in Next.js:
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
- `/base-fort-liberty.html` alias via rewrite
- `/base-fort-cavazos.html` alias via rewrite
- `/base-fort-campbell.html` alias via rewrite
- `/base-fort-bliss.html` alias via rewrite
- `/base-fort-stewart.html` alias via rewrite
- `/base-fort-belvoir.html` alias via rewrite
- `/base-fort-meade.html` alias via rewrite
- `/base-fort-riley.html` alias via rewrite
- `/base-fort-jackson.html` alias via rewrite
- `/base-fort-knox.html` alias via rewrite
- `/base-fort-johnson.html` alias via rewrite
- `/base-fort-drum.html` alias via rewrite
- `/base-fort-sill.html` alias via rewrite
- `/base-fort-leonard-wood.html` alias via rewrite
- `/base-fort-moore.html` alias via rewrite
- `/base-fort-eisenhower.html` alias via rewrite
- `/base-fort-gregg-adams.html` alias via rewrite
- `/base-fort-carson.html` alias via rewrite
- `/base-fort-huachuca.html` alias via rewrite
- `/base-joint-base-lewis-mcchord.html` alias via rewrite
- `/create-account`
- `/create-account.html` alias via rewrite
- `/sign-in`
- `/account`
- package-based browser Supabase bootstrap for migrated auth pages
- legal clickwrap enforcement and legal-context capture on the native signup page
- native sign-in
- native logout on migrated Next surfaces
- native session-aware top-bar account shell
- native account settings page for identity, privacy, move profile, and legal acknowledgment
- native protected checklist route with preserved:
  - `pcs-checklist` localStorage semantics
  - `user_checklist_state` remote sync shape
  - checklist backup/initial-sync markers used by the bridge
- native protected organizer route with preserved:
  - organizer entry-path compatibility through `/move-organizer.html`
  - native links into the migrated inventory and logistics workspaces
- native protected inventory route with preserved:
  - `pcs-move-inventory` localStorage semantics
  - `user_inventory` remote sync shape
  - inventory backup/initial-sync markers used by the bridge
  - `/move-inventory.html` compatibility through rewrite
- native protected logistics route with preserved:
  - `pcs-move-logistics` localStorage semantics
  - `user_move_logistics` remote sync shape
  - itinerary/custom-event persistence semantics
  - `/move-logistics.html` compatibility through rewrite
  - native itinerary, custom-event, and directions-handoff workflow
- native protected bases route with preserved:
  - `/bases.html` compatibility through rewrite
  - native search/state filtering and card rendering for the base library index
  - outbound links resolving directly to native `/bases/<slug>` detail pages
- native protected base-detail template proof with preserved:
  - shared native detail rendering for Fort Liberty, Fort Cavazos, Fort Campbell, Fort Bliss, Fort Stewart, Fort Belvoir, Fort Meade, Fort Riley, Fort Jackson, Fort Knox, Fort Johnson, Fort Drum, Fort Sill, Fort Leonard Wood, Fort Moore, Fort Eisenhower, Fort Gregg-Adams, Fort Carson, Fort Huachuca, and Joint Base Lewis-McChord
  - arrival/helpful-stop section generation from `base-arrival-data.js`
  - sponsored PCS placement rendering on the native pages
  - legacy `base-*.html` detail URLs retained only as compatibility aliases for the native routes

Still legacy:
- route protection for bridged tool/content pages
- guide pages only
- legacy account dropdown on bridged pages only
- local-storage sync, analytics, partner placements, and protected-route enforcement inside `auth-sync.js`

Temporary coexistence is intentional:
- migrated auth pages use:
  - `components/auth/native-auth-provider.js`
  - `lib/supabase/browser-client.js`
- legacy pages still use the CDN client inside `auth-sync.js`
- both paths share `account-data.js` so profile/privacy/move-profile/legal writes stay aligned
- both paths share `checklist-data.js` so checklist local/remote semantics stay aligned
- both paths share `inventory-data.js` so inventory local/remote semantics stay aligned
- both paths share `logistics-data.js` so logistics local/remote semantics stay aligned
- both paths share `/api/public-config` and `/api/legal-context`
- native Next pages no longer load `auth-sync.js` from the root layout
- Google auth remains deferred

## Current Production State
- Production URL: `https://pcs-pal-live.vercel.app/`
- Current auth mode: email/password with email confirmation enabled
- Google auth is prepared but disabled by default
- Legal clickwrap enforcement currently applies to the email signup flow only; Google rollout is deferred.

## Sync and Migration Behavior
Local keys are preserved:
- `pcs-checklist`
- `pcs-move-inventory`
- `pcs-move-logistics`

On authenticated session:
1. Load remote user data from Supabase.
2. If remote data is empty and local data exists, upload local data.
3. If remote data exists, remote becomes canonical and hydrates local storage.
4. If local data differs from remote, local state is backed up under `pcs-sync-backup:<user_id>` before replacement.

Conflict policy:
- Remote wins when remote data exists.
- Local uploads only when remote is empty.

## Schema Summary
Migration creates:
- `profiles`
- `user_checklist_state`
- `user_inventory`
- `user_move_logistics`

Additional additive migration:
- `supabase/migrations/20260310000100_pcs_pal_privacy_analytics_and_partners.sql`
- `supabase/migrations/20260312000100_pcs_pal_legal_documents_and_acceptance.sql`

That migration extends the data model with:
- `profiles` privacy controls: `marketing_consent`, `analytics_consent`, `data_sale_opt_out`, `household_profile_coarse`
- `base_catalog`
- `moves`
- `partners`
- `partner_placements`
- `events`
- `resource_clicks`
- `partner_leads`
- `legal_documents`
- `legal_acceptances`
- `aggregates.*` reporting views

All tables are user-owned and keyed to `auth.users`.

## Privacy + Monetization Notes
- Raw personal-data sale is not the architectural default for PCS-Pal.
- Behavioral analytics is opt-in and tied to `profiles.analytics_consent`.
- Partner leads are explicit user actions and do not rely on passive browsing behavior.
- Sponsored placements are meant to be clearly labeled and queryable by base and category.
- Aggregate reporting lives in `aggregates.*` views and is intended for internal reporting or future B2B exports, not raw user resale.

## Retention Notes
- `events` and `resource_clicks` are designed for short retention.
- `aggregates.*` views can remain longer because they do not expose user rows.
- `public.prune_raw_analytics(interval)` is included for operational pruning of raw analytics.
- Schedule `public.prune_raw_analytics(interval '180 days')` through `pg_cron` or an external job before enabling long-running analytics collection in production.
- Do not route uploads, exact street addresses, or precise itinerary data into analytics tables.

If `pg_cron` is available, a safe starting point is:

```sql
select cron.schedule(
  'pcs-pal-prune-raw-analytics',
  '15 3 * * *',
  $$select public.prune_raw_analytics(interval '180 days');$$
);
```

If `pg_cron` is not available, run the same SQL from an external scheduled job using a service-role connection.

## RLS Summary
RLS is enabled on:
- `profiles`
- `user_checklist_state`
- `user_inventory`
- `user_move_logistics`
- `moves`
- `events`
- `resource_clicks`
- `partner_leads`
- `partners`
- `partner_placements`

Policies allow access only to the authenticated owner:
- `profiles`: `id = auth.uid()`
- user-owned data tables: `user_id = auth.uid()`
- `partners` and `partner_placements`: active rows are selectively readable for the signed-in client flow
- `public.prune_raw_analytics(interval)` is reserved for `service_role`

## Environment Variables
Required:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Optional:
- `SUPABASE_ENABLE_GOOGLE_AUTH=false`
- `LEGAL_IP_HASH_SALT`

When `SUPABASE_ENABLE_GOOGLE_AUTH=true`, the Google sign-in button is shown in the UI.
The migrated `/logistics` page now uses a native itinerary workspace plus an external Google Maps directions handoff, so no client-side Maps API key is required.

## Supabase Setup
1. Open the Supabase project.
2. Run `supabase/migrations/20260309000100_pcs_pal_auth_and_user_data.sql`.
3. Run `supabase/migrations/20260310000100_pcs_pal_privacy_analytics_and_partners.sql`.
4. Run `supabase/migrations/20260312000100_pcs_pal_legal_documents_and_acceptance.sql`.
5. In `Authentication -> Providers`, enable `Email`.
6. Keep email confirmation enabled for production.
7. In `Authentication -> URL Configuration`, set:
   - `Site URL`: `https://pcs-pal-live.vercel.app`
   - `Additional Redirect URLs`:
     - `https://pcs-pal-live.vercel.app/**`
     - `http://localhost:3000/**`
     - `http://127.0.0.1:5500/**` if Live Server is used

## Staging Validation Assets
- Runbook: `docs/staging-privacy-analytics-validation.md`
- Legal docs/versioning notes: `docs/legal-versioning-and-acceptance.md`
- Staging-only seed: `supabase/seeds/20260310010100_staging_validation_seed.sql`
- Aggregate readout: `supabase/validation/analytics_readout.sql`

Recommended staging flow:
1. Apply both migrations in order.
2. Create the three staging-only auth users listed in the runbook.
3. Run the staging seed manually.
4. Validate the account privacy settings UI, sponsored placements, and explicit lead flow through the app.
5. Run the aggregate readout queries to confirm the derived views return coherent aggregate results.

## Vercel Setup
1. Import `BriantheFrank/PCS-Pal` as a Vercel project.
2. Use repository root as the project root (`./`).
3. Set `Framework Preset` to `Next.js`.
4. Use the default Next.js build command.
5. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_ENABLE_GOOGLE_AUTH=false`
   - `LEGAL_IP_HASH_SALT` before legal launch
6. Deploy and verify:
   - `https://pcs-pal-live.vercel.app/api/public-config`
   - `https://pcs-pal-live.vercel.app/api/legal-context`

## Local Development
Recommended local options:
1. `vercel dev` from repo root using `http://localhost:3000`
2. A static dev server plus matching redirect URL allow-list

## Enabling Google Auth Later
1. In Google Cloud Console, create a `Web application` OAuth client.
2. Add authorized JavaScript origins:
   - `https://pcs-pal-live.vercel.app`
   - `http://localhost:3000`
3. Add the authorized redirect URI:
   - `https://jsmeimsvwwfbejedzktg.supabase.co/auth/v1/callback`
4. In Supabase `Authentication -> Providers -> Google`, enable Google and paste the Google client ID and secret.
5. In Supabase `Authentication -> URL Configuration`, keep:
   - `https://pcs-pal-live.vercel.app/**`
   - local dev URLs you actually use
6. In Vercel, set:
   - `SUPABASE_ENABLE_GOOGLE_AUTH=true`
7. Redeploy.

Google auth does not require any new client-side code changes after those settings are in place.

## Manual Smoke Test Checklist
Core stability:
- [ ] `index.html`, `pcs-checklist.html`, `move-organizer.html`, `move-inventory.html`, `move-logistics.html`, and `bases.html` load
- [ ] checklist still works locally
- [ ] inventory still works locally
- [ ] logistics still works locally

Email auth:
- [ ] email sign-up works
- [ ] email confirmation link works
- [ ] email sign-in works
- [ ] sign-out works
- [ ] signup is blocked if the Terms/Privacy registry migration is missing or incomplete

Sync:
- [ ] signed-in checklist changes persist to Supabase
- [ ] signed-in inventory changes persist to Supabase
- [ ] signed-in logistics changes persist to Supabase
- [ ] same user data appears in another browser/device
- [ ] signed-out mode still works locally
- [ ] user A cannot read user B data

Google auth when enabled:
- [ ] Google button appears only after `SUPABASE_ENABLE_GOOGLE_AUTH=true`
- [ ] Google redirect returns to PCS-Pal successfully

## Rollback Plan
1. Revert to the previous production commit in Git and redeploy.
2. Keep local storage data untouched.
3. Leave Supabase tables in place because the schema is additive.
4. Set `SUPABASE_ENABLE_GOOGLE_AUTH=false` if Google rollout needs to be disabled quickly.

