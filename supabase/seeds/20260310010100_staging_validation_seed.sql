-- Staging-only validation seed for PCS Pal privacy-conscious analytics and partner monetization.
-- Run this manually in a staging Supabase SQL editor after both migrations have been applied.
--
-- Prerequisite auth users:
--   pcs-staging-family-1@example.test
--   pcs-staging-family-2@example.test
--   pcs-staging-family-3@example.test

do $$
declare
  missing_users text[];
begin
  select array_agg(expected.email)
  into missing_users
  from (
    values
      ('pcs-staging-family-1@example.test'),
      ('pcs-staging-family-2@example.test'),
      ('pcs-staging-family-3@example.test')
  ) as expected(email)
  left join auth.users
    on auth.users.email = expected.email
  where auth.users.id is null;

  if coalesce(array_length(missing_users, 1), 0) > 0 then
    raise exception
      'Create the required staging auth users before running this seed: %',
      array_to_string(missing_users, ', ');
  end if;
end
$$;

insert into public.partners (
  id,
  slug,
  display_name,
  partner_category,
  partner_status,
  website_url,
  referral_url,
  disclosure_label,
  lead_enabled,
  active,
  metadata_jsonb
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'liberty-lodge-demo',
    'Liberty Lodge Demo',
    'temporary_lodging',
    'active',
    'https://example.test/liberty-lodge',
    'https://example.test/liberty-lodge?ref=pcs-pal-staging',
    'Sponsored test partner',
    true,
    true,
    '{"seeded": true, "notes": "Staging lodging partner"}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'steady-move-demo',
    'Steady Move Demo',
    'moving',
    'active',
    'https://example.test/steady-move',
    'https://example.test/steady-move?ref=pcs-pal-staging',
    'Affiliate test partner',
    false,
    true,
    '{"seeded": true, "notes": "Staging mover partner"}'::jsonb
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'convoy-auto-demo',
    'Convoy Auto Demo',
    'vehicle_shipping',
    'active',
    'https://example.test/convoy-auto',
    'https://example.test/convoy-auto?ref=pcs-pal-staging',
    'Affiliate test partner',
    true,
    true,
    '{"seeded": true, "notes": "Staging vehicle shipping partner"}'::jsonb
  )
on conflict (id) do update
set
  slug = excluded.slug,
  display_name = excluded.display_name,
  partner_category = excluded.partner_category,
  partner_status = excluded.partner_status,
  website_url = excluded.website_url,
  referral_url = excluded.referral_url,
  disclosure_label = excluded.disclosure_label,
  lead_enabled = excluded.lead_enabled,
  active = excluded.active,
  metadata_jsonb = excluded.metadata_jsonb;

insert into public.partner_placements (
  id,
  partner_id,
  base_id,
  service_category,
  placement_kind,
  placement_label,
  cta_label,
  priority,
  active,
  starts_at,
  ends_at
)
values
  (
    'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '11111111-1111-4111-8111-111111111111',
    'fort-liberty',
    'temporary_lodging',
    'sponsored',
    'Sponsored test placement',
    'Check lodging options',
    10,
    true,
    '2026-01-01T00:00:00Z',
    null
  ),
  (
    'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    '22222222-2222-4222-8222-222222222222',
    null,
    'moving',
    'affiliate',
    'Affiliate test placement',
    'Compare movers',
    20,
    true,
    '2026-01-01T00:00:00Z',
    null
  )
on conflict (id) do update
set
  partner_id = excluded.partner_id,
  base_id = excluded.base_id,
  service_category = excluded.service_category,
  placement_kind = excluded.placement_kind,
  placement_label = excluded.placement_label,
  cta_label = excluded.cta_label,
  priority = excluded.priority,
  active = excluded.active,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at;

insert into public.profiles (
  id,
  email,
  full_name,
  analytics_consent,
  marketing_consent,
  data_sale_opt_out,
  household_profile_coarse
)
select
  auth.users.id,
  auth.users.email,
  'Taylor Reed',
  true,
  false,
  true,
  '{"household_size_bucket":"small_family"}'::jsonb
from auth.users
where auth.users.email = 'pcs-staging-family-1@example.test'
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  analytics_consent = excluded.analytics_consent,
  marketing_consent = excluded.marketing_consent,
  data_sale_opt_out = excluded.data_sale_opt_out,
  household_profile_coarse = excluded.household_profile_coarse;

insert into public.profiles (
  id,
  email,
  full_name,
  analytics_consent,
  marketing_consent,
  data_sale_opt_out,
  household_profile_coarse
)
select
  auth.users.id,
  auth.users.email,
  'Jordan Kim',
  true,
  true,
  true,
  '{"household_size_bucket":"couple"}'::jsonb
from auth.users
where auth.users.email = 'pcs-staging-family-2@example.test'
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  analytics_consent = excluded.analytics_consent,
  marketing_consent = excluded.marketing_consent,
  data_sale_opt_out = excluded.data_sale_opt_out,
  household_profile_coarse = excluded.household_profile_coarse;

insert into public.profiles (
  id,
  email,
  full_name,
  analytics_consent,
  marketing_consent,
  data_sale_opt_out,
  household_profile_coarse
)
select
  auth.users.id,
  auth.users.email,
  'Morgan Diaz',
  false,
  false,
  true,
  '{"household_size_bucket":"solo"}'::jsonb
from auth.users
where auth.users.email = 'pcs-staging-family-3@example.test'
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  analytics_consent = excluded.analytics_consent,
  marketing_consent = excluded.marketing_consent,
  data_sale_opt_out = excluded.data_sale_opt_out,
  household_profile_coarse = excluded.household_profile_coarse;

insert into public.moves (
  user_id,
  destination_base_id,
  origin_region,
  move_month,
  move_stage,
  housing_intent,
  lodging_needed,
  vehicle_shipment_needed,
  pets_flag,
  school_age_flag,
  spouse_employment_flag
)
select
  auth.users.id,
  'fort-liberty',
  'southeast',
  '2026-01-01',
  'arrival',
  'on_base',
  true,
  false,
  true,
  true,
  false
from auth.users
where auth.users.email = 'pcs-staging-family-1@example.test'
on conflict (user_id) do update
set
  destination_base_id = excluded.destination_base_id,
  origin_region = excluded.origin_region,
  move_month = excluded.move_month,
  move_stage = excluded.move_stage,
  housing_intent = excluded.housing_intent,
  lodging_needed = excluded.lodging_needed,
  vehicle_shipment_needed = excluded.vehicle_shipment_needed,
  pets_flag = excluded.pets_flag,
  school_age_flag = excluded.school_age_flag,
  spouse_employment_flag = excluded.spouse_employment_flag;

insert into public.moves (
  user_id,
  destination_base_id,
  origin_region,
  move_month,
  move_stage,
  housing_intent,
  lodging_needed,
  vehicle_shipment_needed,
  pets_flag,
  school_age_flag,
  spouse_employment_flag
)
select
  auth.users.id,
  'fort-cavazos',
  'texas',
  '2026-02-01',
  'scheduling',
  'off_base_rent',
  false,
  true,
  false,
  false,
  true
from auth.users
where auth.users.email = 'pcs-staging-family-2@example.test'
on conflict (user_id) do update
set
  destination_base_id = excluded.destination_base_id,
  origin_region = excluded.origin_region,
  move_month = excluded.move_month,
  move_stage = excluded.move_stage,
  housing_intent = excluded.housing_intent,
  lodging_needed = excluded.lodging_needed,
  vehicle_shipment_needed = excluded.vehicle_shipment_needed,
  pets_flag = excluded.pets_flag,
  school_age_flag = excluded.school_age_flag,
  spouse_employment_flag = excluded.spouse_employment_flag;

insert into public.moves (
  user_id,
  destination_base_id,
  origin_region,
  move_month,
  move_stage,
  housing_intent,
  lodging_needed,
  vehicle_shipment_needed,
  pets_flag,
  school_age_flag,
  spouse_employment_flag
)
select
  auth.users.id,
  'joint-base-lewis-mcchord',
  'pacific_northwest',
  '2026-03-01',
  'planning',
  'temporary_only',
  true,
  false,
  false,
  false,
  true
from auth.users
where auth.users.email = 'pcs-staging-family-3@example.test'
on conflict (user_id) do update
set
  destination_base_id = excluded.destination_base_id,
  origin_region = excluded.origin_region,
  move_month = excluded.move_month,
  move_stage = excluded.move_stage,
  housing_intent = excluded.housing_intent,
  lodging_needed = excluded.lodging_needed,
  vehicle_shipment_needed = excluded.vehicle_shipment_needed,
  pets_flag = excluded.pets_flag,
  school_age_flag = excluded.school_age_flag,
  spouse_employment_flag = excluded.spouse_employment_flag;

insert into public.events (
  id,
  user_id,
  event_type,
  base_id,
  service_category,
  event_timestamp,
  metadata_jsonb
)
select
  'e1111111-1111-4111-8111-111111111111',
  auth.users.id,
  'page_view',
  'fort-liberty',
  'arrival_support',
  '2026-01-10T15:30:00Z',
  '{"page_kind":"base_detail","page_slug":"base-fort-liberty","content_category":"base_detail","page_move_stage":"arrival"}'::jsonb
from auth.users
where auth.users.email = 'pcs-staging-family-1@example.test'
on conflict (id) do update
set
  user_id = excluded.user_id,
  event_type = excluded.event_type,
  base_id = excluded.base_id,
  service_category = excluded.service_category,
  event_timestamp = excluded.event_timestamp,
  metadata_jsonb = excluded.metadata_jsonb;

insert into public.events (
  id,
  user_id,
  event_type,
  base_id,
  service_category,
  event_timestamp,
  metadata_jsonb
)
select
  'e2222222-2222-4222-8222-222222222222',
  auth.users.id,
  'page_view',
  'fort-cavazos',
  'travel',
  '2026-02-05T18:00:00Z',
  '{"page_kind":"tool","page_slug":"move-logistics","content_category":"logistics","page_move_stage":"travel"}'::jsonb
from auth.users
where auth.users.email = 'pcs-staging-family-2@example.test'
on conflict (id) do update
set
  user_id = excluded.user_id,
  event_type = excluded.event_type,
  base_id = excluded.base_id,
  service_category = excluded.service_category,
  event_timestamp = excluded.event_timestamp,
  metadata_jsonb = excluded.metadata_jsonb;

insert into public.events (
  id,
  user_id,
  event_type,
  base_id,
  service_category,
  event_timestamp,
  metadata_jsonb
)
select
  'e3333333-3333-4333-8333-333333333333',
  auth.users.id,
  'partner_placement_viewed',
  'fort-liberty',
  'temporary_lodging',
  '2026-01-10T15:31:00Z',
  '{"content_category":"partner_placement","placement_kind":"sponsored","partner_id":"11111111-1111-4111-8111-111111111111"}'::jsonb
from auth.users
where auth.users.email = 'pcs-staging-family-1@example.test'
on conflict (id) do update
set
  user_id = excluded.user_id,
  event_type = excluded.event_type,
  base_id = excluded.base_id,
  service_category = excluded.service_category,
  event_timestamp = excluded.event_timestamp,
  metadata_jsonb = excluded.metadata_jsonb;

insert into public.events (
  id,
  user_id,
  event_type,
  base_id,
  service_category,
  event_timestamp,
  metadata_jsonb
)
select
  'e4444444-4444-4444-8444-444444444444',
  auth.users.id,
  'move_profile_updated',
  'fort-cavazos',
  null,
  '2026-02-01T14:00:00Z',
  '{"content_category":"account","move_stage":"scheduling","housing_intent":"off_base_rent","vehicle_shipment_needed":true}'::jsonb
from auth.users
where auth.users.email = 'pcs-staging-family-2@example.test'
on conflict (id) do update
set
  user_id = excluded.user_id,
  event_type = excluded.event_type,
  base_id = excluded.base_id,
  service_category = excluded.service_category,
  event_timestamp = excluded.event_timestamp,
  metadata_jsonb = excluded.metadata_jsonb;

insert into public.resource_clicks (
  id,
  user_id,
  base_id,
  category,
  partner_id,
  clicked_at,
  target_url
)
select
  'c1111111-1111-4111-8111-111111111111',
  auth.users.id,
  'fort-liberty',
  'temporary_lodging',
  null,
  '2026-01-10T15:32:00Z',
  'https://example.test/official-liberty-lodging'
from auth.users
where auth.users.email = 'pcs-staging-family-1@example.test'
on conflict (id) do update
set
  user_id = excluded.user_id,
  base_id = excluded.base_id,
  category = excluded.category,
  partner_id = excluded.partner_id,
  clicked_at = excluded.clicked_at,
  target_url = excluded.target_url;

insert into public.resource_clicks (
  id,
  user_id,
  base_id,
  category,
  partner_id,
  clicked_at,
  target_url
)
select
  'c2222222-2222-4222-8222-222222222222',
  auth.users.id,
  'fort-liberty',
  'temporary_lodging',
  '11111111-1111-4111-8111-111111111111',
  '2026-01-10T15:33:00Z',
  'https://example.test/liberty-lodge'
from auth.users
where auth.users.email = 'pcs-staging-family-1@example.test'
on conflict (id) do update
set
  user_id = excluded.user_id,
  base_id = excluded.base_id,
  category = excluded.category,
  partner_id = excluded.partner_id,
  clicked_at = excluded.clicked_at,
  target_url = excluded.target_url;

insert into public.resource_clicks (
  id,
  user_id,
  base_id,
  category,
  partner_id,
  clicked_at,
  target_url
)
select
  'c3333333-3333-4333-8333-333333333333',
  auth.users.id,
  'fort-cavazos',
  'moving',
  '22222222-2222-4222-8222-222222222222',
  '2026-02-05T18:05:00Z',
  'https://example.test/steady-move'
from auth.users
where auth.users.email = 'pcs-staging-family-2@example.test'
on conflict (id) do update
set
  user_id = excluded.user_id,
  base_id = excluded.base_id,
  category = excluded.category,
  partner_id = excluded.partner_id,
  clicked_at = excluded.clicked_at,
  target_url = excluded.target_url;

insert into public.partner_leads (
  id,
  user_id,
  partner_id,
  consent_timestamp,
  lead_payload_minimized,
  status,
  created_at
)
select
  'd1111111-1111-4111-8111-111111111111',
  auth.users.id,
  '11111111-1111-4111-8111-111111111111',
  '2026-01-10T15:35:00Z',
  jsonb_build_object(
    'contact_email', auth.users.email,
    'destination_base_id', 'fort-liberty',
    'move_month', '2026-01-01',
    'service_category', 'temporary_lodging',
    'lodging_needed', true,
    'preferred_contact_method', 'email'
  ),
  'requested',
  '2026-01-10T15:35:00Z'
from auth.users
where auth.users.email = 'pcs-staging-family-1@example.test'
on conflict (id) do update
set
  user_id = excluded.user_id,
  partner_id = excluded.partner_id,
  consent_timestamp = excluded.consent_timestamp,
  lead_payload_minimized = excluded.lead_payload_minimized,
  status = excluded.status,
  created_at = excluded.created_at;
