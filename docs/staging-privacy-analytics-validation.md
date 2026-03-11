# PCS Pal Staging Validation Runbook

This runbook validates the additive privacy-conscious analytics and partner workflow foundation in a staging Supabase project. It is intentionally narrow: verify consent, verify coarse analytics, verify sponsored/referral rendering, and verify explicit lead handoff behavior without widening data collection.

## Validation Assets
- Schema migration: `supabase/migrations/20260309000100_pcs_pal_auth_and_user_data.sql`
- Privacy and partner migration: `supabase/migrations/20260310000100_pcs_pal_privacy_analytics_and_partners.sql`
- Staging-only seed: `supabase/seeds/20260310010100_staging_validation_seed.sql`
- Aggregate readout: `supabase/validation/analytics_readout.sql`

## 1. Apply the Schema in Staging
Run both migrations in order against the staging project:

```sql
\i supabase/migrations/20260309000100_pcs_pal_auth_and_user_data.sql
\i supabase/migrations/20260310000100_pcs_pal_privacy_analytics_and_partners.sql
```

If you are using the Supabase SQL editor instead of the CLI, paste the migration contents in sequence.

Quick existence check:

```sql
select
  to_regclass('public.profiles') as profiles,
  to_regclass('public.moves') as moves,
  to_regclass('public.partners') as partners,
  to_regclass('public.partner_placements') as partner_placements,
  to_regclass('public.events') as events,
  to_regclass('public.resource_clicks') as resource_clicks,
  to_regclass('public.partner_leads') as partner_leads,
  to_regclass('aggregates.base_demand_monthly') as base_demand_monthly,
  to_regclass('aggregates.referral_conversion_by_partner') as referral_conversion_by_partner;
```

## 2. Create the Staging Auth Users
Before running the seed, create these staging-only users in Supabase Auth and confirm them:

- `pcs-staging-family-1@example.test`
- `pcs-staging-family-2@example.test`
- `pcs-staging-family-3@example.test`

Use temporary staging passwords managed outside the repo. Do not commit test passwords.

## 3. Run the Staging Seed
Run:

```sql
\i supabase/seeds/20260310010100_staging_validation_seed.sql
```

The seed is manual and rerunnable. It inserts only fake data and does not auto-run in production.

Seed coverage:
- 3 coarse move profiles across January, February, and March 2026
- 3 partners across temporary lodging, moving, and vehicle shipping
- 2 partner placements
- 4 consented events
- 3 resource click rows
- 1 explicit partner lead

## 4. Validate the Account Privacy Settings UI
Sign in through the app with the seeded users and open the existing `Account` panel.

Expected seeded state:
- `pcs-staging-family-1@example.test`
  - analytics enabled
  - marketing disabled
  - data sale opt-out enabled
  - destination base `Fort Liberty`
- `pcs-staging-family-2@example.test`
  - analytics enabled
  - marketing enabled
  - data sale opt-out enabled
  - destination base `Fort Cavazos`
- `pcs-staging-family-3@example.test`
  - analytics disabled
  - marketing disabled
  - data sale opt-out enabled
  - destination base `Joint Base Lewis-McChord`

Manual UI checks:
- The privacy checkboxes render in the authenticated account panel.
- The checkbox state matches the stored profile row.
- Saving privacy settings persists and returns a success status.
- Updating privacy settings does not disrupt sign-in, sign-out, checklist, inventory, logistics, or route behavior.
- The move profile form still saves independently from privacy settings.

## 5. Validate Sponsored and Referral Behavior
Use the seeded base pages for narrow partner-flow validation:

- `base-fort-liberty.html`
  - should show the base-specific `Liberty Lodge Demo` sponsored placement
  - should also show the global `Steady Move Demo` affiliate placement
- `base-fort-cavazos.html`
  - should show the global `Steady Move Demo` affiliate placement
  - should not show the Fort Liberty-specific lodging placement

Behavior checks:
- Sponsored partner cards stay visually distinct from neutral base resources.
- Clicking a partner link creates a `resource_clicks` row only when analytics consent is enabled.
- The lead form is shown only for partners with `lead_enabled = true`.
- A partner lead is created only after explicit form submission with the consent checkbox checked.
- Browsing and clicking partner links never creates a `partner_leads` row by itself.

## 6. Validate Analytics Consent Behavior
Use the app plus targeted staging queries.

Recommended sequence:
1. Sign in as `pcs-staging-family-1@example.test`.
2. Visit `base-fort-liberty.html`.
3. Click one official resource and one partner placement link.
4. Save the privacy form once.
5. Save the move profile once.
6. Sign in as `pcs-staging-family-3@example.test`.
7. Visit `base-joint-base-lewis-mcchord.html`.
8. Click one official resource.

Staging-only verification query:

```sql
select
  auth.users.email,
  count(distinct public.events.id) as event_rows,
  count(distinct public.resource_clicks.id) as click_rows
from auth.users
left join public.events
  on public.events.user_id = auth.users.id
left join public.resource_clicks
  on public.resource_clicks.user_id = auth.users.id
where auth.users.email like 'pcs-staging-family-%@example.test'
group by auth.users.email
order by auth.users.email;
```

Expected outcome:
- activity for `pcs-staging-family-1@example.test` and `pcs-staging-family-2@example.test` can increase
- activity for `pcs-staging-family-3@example.test` should remain unchanged while analytics consent stays disabled

## 7. Validate RLS Behavior
Owner-scoped tables must stay private even though the staging seed uses shared fake data.

Manual checks through the app:
- sign in as family 1 and confirm the account panel shows only family 1 profile and move data
- sign out, sign in as family 2, and confirm family 1 values do not appear
- make a change as family 2, reload, and confirm only family 2 sees that change

Service-role SQL sanity checks:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'moves',
    'events',
    'resource_clicks',
    'partner_leads',
    'partners',
    'partner_placements'
  )
order by tablename;
```

Expected outcome:
- `profiles`, `moves`, `events`, `resource_clicks`, and `partner_leads` have RLS enabled
- `partners` and `partner_placements` remain readable only through their active-row policies

## 8. Run the Aggregate Readout
Run:

```sql
\i supabase/validation/analytics_readout.sql
```

Seed sanity expectations:
- `Fort Liberty`, `Fort Cavazos`, and `Joint Base Lewis-McChord` appear in monthly demand
- `Fort Liberty` shows temporary lodging interest and lodging demand
- `Fort Cavazos` shows moving interest and off-base rent interest
- `Liberty Lodge Demo` shows 1 seeded click and 1 seeded explicit lead
- `Steady Move Demo` shows 1 seeded click and 0 seeded explicit leads

The readout is aggregate-only and is intended for internal validation, not user-facing reporting.

## 9. Retention and Operational Follow-Through
Raw analytics tables are intentionally short-lived:
- `public.events`
- `public.resource_clicks`

Aggregate views under `aggregates.*` are long-lived because they do not expose user rows.

Recommended production-like staging schedule:

```sql
select cron.schedule(
  'pcs-pal-prune-raw-analytics',
  '15 3 * * *',
  $$select public.prune_raw_analytics(interval '180 days');$$
);
```

If `pg_cron` is not available, schedule the same SQL through an external job using a service-role connection. Do not grant anonymous or authenticated clients permission to call the pruning function.

## 10. Remaining Manual Checks Before Production Rollout
- Apply migrations in a real staging project and confirm they succeed without manual edits.
- Verify the seeded partner cards render in the deployed staging environment, not just local static preview.
- Confirm legal/product review of the final disclosure copy before exposing partner placements in production.
- Decide whether any future anonymous analytics should be added; they are intentionally not enabled in the current client flow.
