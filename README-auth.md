# PCS-Pal Auth + Cloud Sync

## Architecture Summary
PCS-Pal remains a static multi-page HTML/CSS/JavaScript site at the repo root.

Additive components introduced:
- `auth-sync.js`: browser auth + sync layer, loaded on all root HTML pages
- `api/public-config.js`: Vercel serverless endpoint that exposes only public Supabase runtime config
- `supabase/migrations/20260309000100_pcs_pal_auth_and_user_data.sql`: additive schema + RLS policies
- `vercel.json`: Node runtime mapping for API functions

The original route/file structure, checklist UI behavior, inventory UI behavior, and shared styling patterns are preserved.

## Sync and Migration Behavior
Local keys are preserved:
- `pcs-checklist`
- `pcs-move-inventory`
- `pcs-move-logistics` (new local key for logistics persistence)

On authenticated session:
1. Load remote user data from Supabase.
2. If remote dataset is empty and local has data, upload local to remote.
3. If remote has data, remote is canonical and hydrates local storage.
4. If local non-empty differs from remote, local snapshot is backed up to `pcs-sync-backup:<user_id>` before replacement.

Conflict policy is deterministic:
- **Remote wins when remote exists**
- **Local uploads only when remote is empty**

## Schema Summary
Migration creates:
- `profiles`
  - `id uuid primary key references auth.users(id)`
  - `email text`
  - `full_name text null`
  - timestamps
- `user_checklist_state`
  - `id uuid primary key`
  - `user_id uuid references auth.users(id)`
  - `checklist_key text`
  - `checked boolean`
  - timestamps
  - `unique(user_id, checklist_key)`
- `user_inventory`
  - `id uuid primary key`
  - `user_id uuid references auth.users(id)`
  - `payload jsonb`
  - timestamps
  - `unique(user_id)`
- `user_move_logistics`
  - `id uuid primary key`
  - `user_id uuid references auth.users(id)`
  - `payload jsonb`
  - timestamps
  - `unique(user_id)`

Also includes indexes on `user_id` and an `updated_at` trigger function.

## RLS Summary
RLS is enabled on all user-owned tables.

Policies enforce per-user ownership:
- `profiles`: access only where `id = auth.uid()`
- data tables: access only where `user_id = auth.uid()`
- select/insert/update/delete policies are scoped to owner only

No service-role key is used in client code.

## Environment Variables Checklist
Required:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Do not put `SUPABASE_SERVICE_ROLE_KEY` in frontend code or Vercel public runtime.

## Supabase Setup Steps
1. Create or open your Supabase project.
2. In SQL editor, run `supabase/migrations/20260309000100_pcs_pal_auth_and_user_data.sql`.
3. In **Authentication > Providers**, enable:
   - Email
   - Google
4. In **Authentication > URL Configuration**, add site URLs and redirect URLs (see below).

## Google OAuth Setup Steps
In Google Cloud Console:
1. Configure OAuth consent screen.
2. Add authorized JavaScript origins:
   - `http://localhost:3000` (or your local static host)
   - `https://<your-vercel-domain>`
3. Add authorized redirect URIs:
   - `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`

In Supabase Auth provider settings:
- Set Google client ID and secret.
- Ensure redirect URLs include:
  - local page URLs, e.g. `http://localhost:3000/index.html`
  - production page URLs, e.g. `https://<your-vercel-domain>/index.html`

## Vercel Setup Steps
1. Import this repository in Vercel.
2. Set root directory to repository root (`PCS-Pal`).
3. Add project environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Deploy.
5. Confirm `https://<your-domain>/api/public-config` returns URL + anon key JSON.
6. After env var changes, trigger redeploy.

## Local Development Steps
This repo has no required build step for root static site.

Recommended local run options:
1. Use any static server from repo root (for example VS Code Live Server).
2. Ensure `auth-sync.js` can call `/api/public-config` in your dev environment.
3. For fully matching Vercel API behavior, run with Vercel CLI (`vercel dev`) from repo root.

## Manual Smoke Test Checklist
Core site stability:
- [ ] `index.html`, `pcs-checklist.html`, `move-organizer.html`, `move-inventory.html`, `move-logistics.html`, `bases.html` load without route/name changes
- [ ] Existing checklist interactions still work locally
- [ ] Existing inventory interactions still work locally

Auth:
- [ ] Email/password sign up works
- [ ] Email/password sign in works
- [ ] Google sign in redirects and returns successfully
- [ ] Signed-in state appears in header auth panel
- [ ] Sign out works

Sync:
- [ ] Signed-in checklist changes persist to Supabase
- [ ] Signed-in inventory changes persist to Supabase
- [ ] Signed-in logistics form changes persist to Supabase
- [ ] Same user data appears on second browser/device after sign in
- [ ] Signed-out mode still works with local storage
- [ ] User A cannot read/write User B data (RLS validation)

## Rollback Plan
If rollback is needed:
1. Redeploy previous production commit.
2. Disable new auth UI script includes by reverting `auth-sync.js` references in HTML.
3. Keep local storage data untouched.
4. Leave Supabase tables in place (non-breaking additive schema) or archive tables if policy requires.
5. Re-enable cloud features once configuration and smoke tests pass.