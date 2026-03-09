# PCS-Pal Auth + Cloud Sync

## Architecture Summary
PCS-Pal remains a static multi-page HTML/CSS/JavaScript site at the repo root.

Additive components:
- `auth-sync.js`: browser auth and data sync layer
- `api/public-config.js`: Vercel serverless endpoint exposing public runtime config
- `supabase/migrations/20260309000100_pcs_pal_auth_and_user_data.sql`: schema and RLS setup

The original HTML routes, checklist behavior, inventory behavior, and shared styling remain intact.

## Current Production State
- Production URL: `https://pcs-pal-live.vercel.app/`
- Current auth mode: email/password with email confirmation enabled
- Google auth is prepared but disabled by default

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

All tables are user-owned and keyed to `auth.users`.

## RLS Summary
RLS is enabled on:
- `profiles`
- `user_checklist_state`
- `user_inventory`
- `user_move_logistics`

Policies allow access only to the authenticated owner:
- `profiles`: `id = auth.uid()`
- data tables: `user_id = auth.uid()`

## Environment Variables
Required:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Optional:
- `SUPABASE_ENABLE_GOOGLE_AUTH=false`

When `SUPABASE_ENABLE_GOOGLE_AUTH=true`, the Google sign-in button is shown in the UI.

## Supabase Setup
1. Open the Supabase project.
2. Run `supabase/migrations/20260309000100_pcs_pal_auth_and_user_data.sql`.
3. In `Authentication -> Providers`, enable `Email`.
4. Keep email confirmation enabled for production.
5. In `Authentication -> URL Configuration`, set:
   - `Site URL`: `https://pcs-pal-live.vercel.app`
   - `Additional Redirect URLs`:
     - `https://pcs-pal-live.vercel.app/**`
     - `http://localhost:3000/**`
     - `http://127.0.0.1:5500/**` if Live Server is used

## Vercel Setup
1. Import `BriantheFrank/PCS-Pal` as a Vercel project.
2. Use repository root as the project root (`./`).
3. Set `Framework Preset` to `Other`.
4. Leave build command empty.
5. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_ENABLE_GOOGLE_AUTH=false`
6. Deploy and verify:
   - `https://pcs-pal-live.vercel.app/api/public-config`

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
