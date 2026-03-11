-- PCS Pal privacy-conscious analytics, partner monetization, and aggregate demand intelligence.
-- This migration is additive and preserves the existing auth, checklist, organizer, and base flows.

create extension if not exists pgcrypto;
create schema if not exists aggregates;

do $$
begin
  create type public.move_stage_enum as enum (
    'pre_orders',
    'orders_received',
    'planning',
    'scheduling',
    'packout',
    'travel',
    'arrival',
    'settling_in'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.housing_intent_enum as enum (
    'undecided',
    'on_base',
    'off_base_rent',
    'off_base_buy',
    'temporary_only'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.service_category_enum as enum (
    'moving',
    'storage',
    'vehicle_shipping',
    'temporary_lodging',
    'mortgage',
    'rental_housing',
    'home_services',
    'pet_relocation',
    'childcare',
    'local_services',
    'housing',
    'medical',
    'id_cards',
    'transportation',
    'schools',
    'spouse_employment',
    'finance',
    'travel',
    'arrival_support'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.partner_status_enum as enum ('draft', 'active', 'inactive');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.partner_lead_status_enum as enum (
    'requested',
    'reviewed',
    'shared',
    'fulfilled',
    'closed',
    'rejected'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.placement_kind_enum as enum ('sponsored', 'affiliate');
exception
  when duplicate_object then null;
end
$$;

alter table public.profiles
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists analytics_consent boolean not null default false,
  add column if not exists data_sale_opt_out boolean not null default true,
  add column if not exists household_profile_coarse jsonb not null default '{}'::jsonb;

alter table public.profiles
  drop constraint if exists profiles_household_profile_coarse_object;

alter table public.profiles
  add constraint profiles_household_profile_coarse_object
  check (jsonb_typeof(household_profile_coarse) = 'object');

comment on column public.profiles.marketing_consent is
  'User-approved permission for partner and lifecycle marketing messages. Defaults to false.';
comment on column public.profiles.analytics_consent is
  'User-approved permission for privacy-conscious analytics event capture. Defaults to false.';
comment on column public.profiles.data_sale_opt_out is
  'Privacy-protective default. PCS Pal architecture is not centered on selling raw user data.';
comment on column public.profiles.household_profile_coarse is
  'Minimized household profile using coarse buckets only. Do not store street addresses, itineraries, or sensitive IDs here.';

create table if not exists public.base_catalog (
  id text primary key,
  installation_name text not null,
  state_or_region text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.base_catalog (id, installation_name, state_or_region)
values
  ('fort-liberty', 'Fort Liberty', 'North Carolina'),
  ('fort-campbell', 'Fort Campbell', 'Kentucky / Tennessee'),
  ('fort-cavazos', 'Fort Cavazos', 'Texas'),
  ('joint-base-lewis-mcchord', 'Joint Base Lewis-McChord', 'Washington'),
  ('fort-moore', 'Fort Moore', 'Georgia'),
  ('fort-bliss', 'Fort Bliss', 'Texas'),
  ('fort-carson', 'Fort Carson', 'Colorado'),
  ('fort-stewart', 'Fort Stewart', 'Georgia'),
  ('fort-drum', 'Fort Drum', 'New York'),
  ('fort-riley', 'Fort Riley', 'Kansas'),
  ('fort-johnson', 'Fort Johnson', 'Louisiana'),
  ('fort-sill', 'Fort Sill', 'Oklahoma'),
  ('fort-leonard-wood', 'Fort Leonard Wood', 'Missouri'),
  ('fort-jackson', 'Fort Jackson', 'South Carolina'),
  ('fort-eisenhower', 'Fort Eisenhower', 'Georgia'),
  ('fort-belvoir', 'Fort Belvoir', 'Virginia'),
  ('fort-meade', 'Fort Meade', 'Maryland'),
  ('fort-knox', 'Fort Knox', 'Kentucky'),
  ('fort-huachuca', 'Fort Huachuca', 'Arizona'),
  ('fort-gregg-adams', 'Fort Gregg-Adams', 'Virginia')
on conflict (id) do update
set
  installation_name = excluded.installation_name,
  state_or_region = excluded.state_or_region;

create table if not exists public.moves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination_base_id text references public.base_catalog(id) on delete set null,
  origin_region text,
  move_month date,
  move_stage public.move_stage_enum not null default 'planning',
  housing_intent public.housing_intent_enum,
  lodging_needed boolean not null default false,
  vehicle_shipment_needed boolean not null default false,
  pets_flag boolean not null default false,
  school_age_flag boolean not null default false,
  spouse_employment_flag boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id),
  constraint moves_origin_region_coarse check (origin_region is null or char_length(origin_region) <= 80),
  constraint moves_move_month_is_month_start check (
    move_month is null or date_trunc('month', move_month)::date = move_month
  )
);

comment on table public.moves is
  'Single coarse PCS move profile per user for demand analytics and product personalization. Avoid exact itineraries and exact addresses.';

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  partner_category public.service_category_enum not null,
  partner_status public.partner_status_enum not null default 'draft',
  website_url text,
  referral_url text,
  disclosure_label text not null default 'Sponsored',
  lead_enabled boolean not null default false,
  active boolean not null default false,
  metadata_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partners_metadata_jsonb_object check (jsonb_typeof(metadata_jsonb) = 'object')
);

comment on table public.partners is
  'Partner directory for affiliate, sponsored, and explicit-consent lead workflows. Not a raw user data marketplace.';

create table if not exists public.partner_placements (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  base_id text references public.base_catalog(id) on delete cascade,
  service_category public.service_category_enum,
  placement_kind public.placement_kind_enum not null default 'sponsored',
  placement_label text not null default 'Sponsored',
  cta_label text not null default 'Visit partner',
  priority integer not null default 100,
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_placements_valid_window check (ends_at is null or ends_at >= starts_at)
);

comment on table public.partner_placements is
  'Lightweight placement model for installation-level or category-level sponsored cards with clear disclosure.';

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_session_id uuid,
  event_type text not null,
  base_id text references public.base_catalog(id) on delete set null,
  service_category public.service_category_enum,
  event_timestamp timestamptz not null default now(),
  metadata_jsonb jsonb not null default '{}'::jsonb,
  constraint events_metadata_jsonb_object check (jsonb_typeof(metadata_jsonb) = 'object'),
  constraint events_event_type_length check (char_length(event_type) between 3 and 80)
);

comment on table public.events is
  'Short-retention product analytics. Only store coarse, non-sensitive metadata. Do not place exact addresses, itineraries, or uploaded documents here.';

create table if not exists public.resource_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_session_id uuid,
  base_id text references public.base_catalog(id) on delete set null,
  category public.service_category_enum,
  partner_id uuid references public.partners(id) on delete set null,
  clicked_at timestamptz not null default now(),
  target_url text,
  constraint resource_clicks_target_url_length check (target_url is null or char_length(target_url) <= 2048)
);

comment on table public.resource_clicks is
  'Short-retention clickout tracking for official resources, affiliate links, and sponsored placements. Strip querystrings before logging.';

create table if not exists public.partner_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  consent_timestamp timestamptz not null,
  lead_payload_minimized jsonb not null,
  status public.partner_lead_status_enum not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_leads_payload_object check (jsonb_typeof(lead_payload_minimized) = 'object')
);

comment on table public.partner_leads is
  'Explicit-consent partner requests only. Lead payload must stay minimal and separate from passive browsing analytics.';

create index if not exists idx_moves_destination_month
  on public.moves (destination_base_id, move_month);
create index if not exists idx_moves_move_stage
  on public.moves (move_stage);
create index if not exists idx_partners_category_active
  on public.partners (partner_category, active);
create index if not exists idx_partner_placements_lookup
  on public.partner_placements (base_id, service_category, active, priority);
create index if not exists idx_events_user_timestamp
  on public.events (user_id, event_timestamp desc);
create index if not exists idx_events_base_timestamp
  on public.events (base_id, event_timestamp desc);
create index if not exists idx_events_service_timestamp
  on public.events (service_category, event_timestamp desc);
create index if not exists idx_resource_clicks_user_timestamp
  on public.resource_clicks (user_id, clicked_at desc);
create index if not exists idx_resource_clicks_partner_timestamp
  on public.resource_clicks (partner_id, clicked_at desc);
create index if not exists idx_resource_clicks_base_timestamp
  on public.resource_clicks (base_id, clicked_at desc);
create index if not exists idx_partner_leads_partner_timestamp
  on public.partner_leads (partner_id, created_at desc);
create index if not exists idx_partner_leads_user_timestamp
  on public.partner_leads (user_id, created_at desc);

create or replace function public.analytics_consent_enabled()
returns boolean
language sql
stable
as $$
  select coalesce(
    (
      select profiles.analytics_consent
      from public.profiles
      where profiles.id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.apply_authenticated_user_id()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is null and auth.uid() is not null then
    new.user_id = auth.uid();
  end if;
  return new;
end;
$$;

create or replace function public.validate_analytics_event_payload()
returns trigger
language plpgsql
as $$
declare
  sensitive_key text;
  sensitive_keys text[] := array[
    'address',
    'street_address',
    'full_address',
    'lat',
    'lng',
    'latitude',
    'longitude',
    'geolocation',
    'route',
    'itinerary',
    'orders',
    'document',
    'upload',
    'ssn',
    'dob',
    'passport',
    'driver_license',
    'bank_account',
    'email',
    'phone',
    'contact_name',
    'notes'
  ];
begin
  if new.metadata_jsonb is null then
    new.metadata_jsonb = '{}'::jsonb;
  end if;

  if jsonb_typeof(new.metadata_jsonb) <> 'object' then
    raise exception 'Analytics metadata must be a JSON object.';
  end if;

  if pg_column_size(new.metadata_jsonb) > 4096 then
    raise exception 'Analytics metadata exceeds the allowed size.';
  end if;

  foreach sensitive_key in array sensitive_keys loop
    if new.metadata_jsonb ? sensitive_key then
      raise exception 'Analytics metadata key % is not allowed.', sensitive_key;
    end if;
  end loop;

  return new;
end;
$$;

create or replace function public.validate_partner_lead_payload()
returns trigger
language plpgsql
as $$
declare
  disallowed_key text;
  allowed_keys text[] := array[
    'contact_email',
    'destination_base_id',
    'move_month',
    'service_category',
    'housing_intent',
    'lodging_needed',
    'vehicle_shipment_needed',
    'pets_flag',
    'school_age_flag',
    'spouse_employment_flag',
    'preferred_contact_method'
  ];
begin
  if jsonb_typeof(new.lead_payload_minimized) <> 'object' then
    raise exception 'Lead payload must be a JSON object.';
  end if;

  if pg_column_size(new.lead_payload_minimized) > 4096 then
    raise exception 'Lead payload exceeds the allowed size.';
  end if;

  if coalesce(new.lead_payload_minimized ->> 'contact_email', '') = '' then
    raise exception 'Lead payload must include contact_email.';
  end if;

  for disallowed_key in
    select key
    from jsonb_object_keys(new.lead_payload_minimized) as key
    where not (key = any(allowed_keys))
  loop
    raise exception 'Lead payload key % is not allowed.', disallowed_key;
  end loop;

  if not exists (
    select 1
    from public.partners
    where partners.id = new.partner_id
      and partners.active = true
      and partners.lead_enabled = true
  ) then
    raise exception 'Selected partner is not enabled for lead intake.';
  end if;

  return new;
end;
$$;

create or replace function public.prune_raw_analytics(retention_window interval default interval '180 days')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.events
  where event_timestamp < now() - retention_window;

  delete from public.resource_clicks
  where clicked_at < now() - retention_window;
end;
$$;

comment on function public.prune_raw_analytics(interval) is
  'Operational retention helper. Schedule through pg_cron or an external job so raw events and clickouts remain short-lived.';

revoke all on function public.prune_raw_analytics(interval) from public, anon, authenticated;
grant execute on function public.prune_raw_analytics(interval) to service_role;

drop trigger if exists trg_base_catalog_updated_at on public.base_catalog;
create trigger trg_base_catalog_updated_at
before update on public.base_catalog
for each row
execute function public.set_updated_at();

drop trigger if exists trg_moves_updated_at on public.moves;
create trigger trg_moves_updated_at
before update on public.moves
for each row
execute function public.set_updated_at();

drop trigger if exists trg_partners_updated_at on public.partners;
create trigger trg_partners_updated_at
before update on public.partners
for each row
execute function public.set_updated_at();

drop trigger if exists trg_partner_placements_updated_at on public.partner_placements;
create trigger trg_partner_placements_updated_at
before update on public.partner_placements
for each row
execute function public.set_updated_at();

drop trigger if exists trg_partner_leads_updated_at on public.partner_leads;
create trigger trg_partner_leads_updated_at
before update on public.partner_leads
for each row
execute function public.set_updated_at();

drop trigger if exists trg_events_apply_authenticated_user on public.events;
create trigger trg_events_apply_authenticated_user
before insert on public.events
for each row
execute function public.apply_authenticated_user_id();

drop trigger if exists trg_events_validate_payload on public.events;
create trigger trg_events_validate_payload
before insert or update on public.events
for each row
execute function public.validate_analytics_event_payload();

drop trigger if exists trg_resource_clicks_apply_authenticated_user on public.resource_clicks;
create trigger trg_resource_clicks_apply_authenticated_user
before insert on public.resource_clicks
for each row
execute function public.apply_authenticated_user_id();

drop trigger if exists trg_partner_leads_apply_authenticated_user on public.partner_leads;
create trigger trg_partner_leads_apply_authenticated_user
before insert on public.partner_leads
for each row
execute function public.apply_authenticated_user_id();

drop trigger if exists trg_partner_leads_validate_payload on public.partner_leads;
create trigger trg_partner_leads_validate_payload
before insert or update on public.partner_leads
for each row
execute function public.validate_partner_lead_payload();

alter table public.base_catalog enable row level security;
alter table public.moves enable row level security;
alter table public.partners enable row level security;
alter table public.partner_placements enable row level security;
alter table public.events enable row level security;
alter table public.resource_clicks enable row level security;
alter table public.partner_leads enable row level security;

drop policy if exists "base_catalog_read" on public.base_catalog;
create policy "base_catalog_read"
on public.base_catalog
for select
using (true);

drop policy if exists "moves_select_own" on public.moves;
create policy "moves_select_own"
on public.moves
for select
using (user_id = auth.uid());

drop policy if exists "moves_insert_own" on public.moves;
create policy "moves_insert_own"
on public.moves
for insert
with check (user_id = auth.uid());

drop policy if exists "moves_update_own" on public.moves;
create policy "moves_update_own"
on public.moves
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "moves_delete_own" on public.moves;
create policy "moves_delete_own"
on public.moves
for delete
using (user_id = auth.uid());

drop policy if exists "partners_select_active" on public.partners;
create policy "partners_select_active"
on public.partners
for select
using (active = true and partner_status = 'active');

drop policy if exists "partner_placements_select_active" on public.partner_placements;
create policy "partner_placements_select_active"
on public.partner_placements
for select
using (
  active = true
  and starts_at <= now()
  and (ends_at is null or ends_at >= now())
  and exists (
    select 1
    from public.partners
    where partners.id = partner_placements.partner_id
      and partners.active = true
      and partners.partner_status = 'active'
  )
);

drop policy if exists "events_select_own" on public.events;
create policy "events_select_own"
on public.events
for select
using (user_id = auth.uid());

drop policy if exists "events_insert_consented" on public.events;
create policy "events_insert_consented"
on public.events
for insert
with check (
  user_id = auth.uid()
  and public.analytics_consent_enabled()
);

drop policy if exists "resource_clicks_select_own" on public.resource_clicks;
create policy "resource_clicks_select_own"
on public.resource_clicks
for select
using (user_id = auth.uid());

drop policy if exists "resource_clicks_insert_consented" on public.resource_clicks;
create policy "resource_clicks_insert_consented"
on public.resource_clicks
for insert
with check (
  user_id = auth.uid()
  and public.analytics_consent_enabled()
);

drop policy if exists "partner_leads_select_own" on public.partner_leads;
create policy "partner_leads_select_own"
on public.partner_leads
for select
using (user_id = auth.uid());

drop policy if exists "partner_leads_insert_own" on public.partner_leads;
create policy "partner_leads_insert_own"
on public.partner_leads
for insert
with check (
  user_id = auth.uid()
  and consent_timestamp is not null
);

revoke all on schema aggregates from public;
revoke all on all tables in schema aggregates from anon, authenticated, public;
grant usage on schema aggregates to service_role;

create or replace view aggregates.base_demand_monthly as
with monthly as (
  select
    destination_base_id,
    move_month,
    count(*)::bigint as total_moves
  from public.moves
  where destination_base_id is not null
    and move_month is not null
  group by destination_base_id, move_month
)
select
  destination_base_id,
  move_month,
  total_moves,
  round(
    (
      (total_moves - lag(total_moves) over (
        partition by destination_base_id
        order by move_month
      ))::numeric
      / nullif(
        lag(total_moves) over (
          partition by destination_base_id
          order by move_month
        ),
        0
      )
    ) * 100,
    2
  ) as pct_change_vs_prior_period,
  round(
    avg(total_moves) over (
      partition by destination_base_id
      order by move_month
      rows between 2 preceding and current row
    ),
    2
  ) as rolling_avg,
  timezone('utc', now()) as updated_at
from monthly;

comment on view aggregates.base_demand_monthly is
  'Aggregate destination demand by installation and month for internal benchmarking and B2B demand products.';

create or replace view aggregates.service_interest_by_base as
with signals as (
  select
    base_id,
    service_category
  from public.events
  where base_id is not null
    and service_category is not null

  union all

  select
    base_id,
    category as service_category
  from public.resource_clicks
  where base_id is not null
    and category is not null
)
select
  base_id,
  service_category,
  count(*)::bigint as interest_count,
  round(
    count(*)::numeric
    / nullif(sum(count(*)) over (partition by base_id), 0),
    4
  ) as interest_rate,
  'all_time'::text as time_window,
  timezone('utc', now()) as updated_at
from signals
group by base_id, service_category;

comment on view aggregates.service_interest_by_base is
  'Aggregated service-category demand by installation, derived from consented events and clickouts only.';

create or replace view aggregates.arrival_week_needs_summary as
with arrival_moves as (
  select
    destination_base_id as base_id,
    housing_intent,
    lodging_needed,
    vehicle_shipment_needed,
    school_age_flag,
    spouse_employment_flag
  from public.moves
  where destination_base_id is not null
    and move_stage in ('arrival', 'settling_in')
),
need_rows as (
  select
    base_id,
    need_category
  from arrival_moves
  cross join lateral (
    values
      ('housing', housing_intent is not null and housing_intent <> 'undecided'::public.housing_intent_enum),
      ('temporary_lodging', lodging_needed),
      ('vehicle_shipping', vehicle_shipment_needed),
      ('schools', school_age_flag),
      ('spouse_employment', spouse_employment_flag)
  ) as needs(need_category, is_needed)
  where is_needed
),
base_totals as (
  select
    base_id,
    count(*)::numeric as total_arrival_moves
  from arrival_moves
  group by base_id
)
select
  need_rows.base_id,
  need_rows.need_category,
  count(*)::bigint as count,
  round(
    count(*)::numeric
    / nullif(base_totals.total_arrival_moves, 0),
    4
  ) as rate,
  'arrival_to_settling_in'::text as reporting_window,
  timezone('utc', now()) as updated_at
from need_rows
join base_totals
  on base_totals.base_id = need_rows.base_id
group by
  need_rows.base_id,
  need_rows.need_category,
  base_totals.total_arrival_moves;

comment on view aggregates.arrival_week_needs_summary is
  'First-week need mix by installation using only coarse move-profile signals.';

create or replace view aggregates.content_engagement_by_move_stage as
with content_events as (
  select
    coalesce(
      public.moves.move_stage::text,
      nullif(public.events.metadata_jsonb ->> 'page_move_stage', ''),
      'planning'
    ) as move_stage,
    nullif(public.events.metadata_jsonb ->> 'content_category', '') as content_category
  from public.events
  left join public.moves
    on public.moves.user_id = public.events.user_id
  where public.events.event_type in ('page_view', 'content_engagement')
    and nullif(public.events.metadata_jsonb ->> 'content_category', '') is not null
),
stage_totals as (
  select
    move_stage,
    count(*)::numeric as total_events
  from content_events
  group by move_stage
)
select
  content_events.move_stage,
  content_events.content_category,
  count(*)::bigint as engagement_count,
  round(
    count(*)::numeric
    / nullif(stage_totals.total_events, 0),
    4
  ) as ctr_or_engagement_rate,
  'all_time'::text as time_window,
  timezone('utc', now()) as updated_at
from content_events
join stage_totals
  on stage_totals.move_stage = content_events.move_stage
group by
  content_events.move_stage,
  content_events.content_category,
  stage_totals.total_events;

comment on view aggregates.content_engagement_by_move_stage is
  'Content engagement by coarse move stage for internal content strategy and premium reporting products.';

create or replace view aggregates.referral_conversion_by_partner as
with click_counts as (
  select
    partner_id,
    count(*)::numeric as referral_clicks
  from public.resource_clicks
  where partner_id is not null
  group by partner_id
),
lead_counts as (
  select
    partner_id,
    count(*)::numeric as lead_submissions
  from public.partner_leads
  group by partner_id
)
select
  coalesce(click_counts.partner_id, lead_counts.partner_id) as partner_id,
  coalesce(click_counts.referral_clicks, 0)::bigint as referral_clicks,
  coalesce(lead_counts.lead_submissions, 0)::bigint as lead_submissions,
  round(
    coalesce(lead_counts.lead_submissions, 0)
    / nullif(coalesce(click_counts.referral_clicks, 0), 0),
    4
  ) as conversion_rate,
  'all_time'::text as time_window,
  timezone('utc', now()) as updated_at
from click_counts
full outer join lead_counts
  on lead_counts.partner_id = click_counts.partner_id;

comment on view aggregates.referral_conversion_by_partner is
  'Partner referral funnel conversion view using clickouts and explicit lead submissions only.';

create or replace view aggregates.housing_interest_by_installation as
select
  destination_base_id as base_id,
  count(*) filter (where housing_intent = 'on_base')::bigint as on_base_interest_count,
  count(*) filter (
    where housing_intent in ('off_base_rent', 'off_base_buy')
  )::bigint as off_base_interest_count,
  count(*) filter (where housing_intent = 'off_base_rent')::bigint as rent_interest_count,
  count(*) filter (where housing_intent = 'off_base_buy')::bigint as buy_interest_count,
  'all_time'::text as time_window,
  timezone('utc', now()) as updated_at
from public.moves
where destination_base_id is not null
group by destination_base_id;

comment on view aggregates.housing_interest_by_installation is
  'Installation-level housing intent summary using coarse on-base/off-base preference data.';

create or replace view aggregates.temporary_lodging_demand_by_base as
select
  destination_base_id as base_id,
  move_month,
  count(*) filter (where lodging_needed)::bigint as lodging_need_count,
  round(
    (count(*) filter (where lodging_needed))::numeric
    / nullif(count(*)::numeric, 0),
    4
  ) as lodging_need_rate,
  timezone('utc', now()) as updated_at
from public.moves
where destination_base_id is not null
  and move_month is not null
group by destination_base_id, move_month;

comment on view aggregates.temporary_lodging_demand_by_base is
  'Monthly temporary lodging demand signal by installation.';

create or replace view aggregates.school_search_trends_by_installation as
with school_signal_rows as (
  select
    destination_base_id as base_id,
    move_month,
    user_id::text || ':move' as signal_key
  from public.moves
  where destination_base_id is not null
    and move_month is not null
    and school_age_flag = true

  union

  select
    coalesce(public.resource_clicks.base_id, public.moves.destination_base_id) as base_id,
    coalesce(
      public.moves.move_month,
      date_trunc('month', public.resource_clicks.clicked_at)::date
    ) as move_month,
    coalesce(
      public.resource_clicks.user_id::text,
      public.resource_clicks.anonymous_session_id::text,
      public.resource_clicks.id::text
    ) || ':click' as signal_key
  from public.resource_clicks
  left join public.moves
    on public.moves.user_id = public.resource_clicks.user_id
  where public.resource_clicks.category = 'schools'
    and coalesce(public.resource_clicks.base_id, public.moves.destination_base_id) is not null

  union

  select
    coalesce(public.events.base_id, public.moves.destination_base_id) as base_id,
    coalesce(
      public.moves.move_month,
      date_trunc('month', public.events.event_timestamp)::date
    ) as move_month,
    coalesce(
      public.events.user_id::text,
      public.events.anonymous_session_id::text,
      public.events.id::text
    ) || ':event' as signal_key
  from public.events
  left join public.moves
    on public.moves.user_id = public.events.user_id
  where public.events.service_category = 'schools'
    and coalesce(public.events.base_id, public.moves.destination_base_id) is not null
),
monthly_interest as (
  select
    base_id,
    move_month,
    count(distinct signal_key)::bigint as school_interest_count
  from school_signal_rows
  where move_month is not null
  group by base_id, move_month
),
monthly_move_totals as (
  select
    destination_base_id as base_id,
    move_month,
    count(*)::numeric as total_moves
  from public.moves
  where destination_base_id is not null
    and move_month is not null
  group by destination_base_id, move_month
)
select
  monthly_interest.base_id,
  monthly_interest.move_month,
  monthly_interest.school_interest_count,
  round(
    monthly_interest.school_interest_count::numeric
    / nullif(monthly_move_totals.total_moves, 0),
    4
  ) as school_interest_rate,
  (
    monthly_interest.school_interest_count
    - lag(monthly_interest.school_interest_count) over (
      partition by monthly_interest.base_id
      order by monthly_interest.move_month
    )
  )::bigint as trend_delta,
  timezone('utc', now()) as updated_at
from monthly_interest
left join monthly_move_totals
  on monthly_move_totals.base_id = monthly_interest.base_id
 and monthly_move_totals.move_month = monthly_interest.move_month;

comment on view aggregates.school_search_trends_by_installation is
  'School-interest trend signal by installation and month using coarse family-need and school-resource engagement data.';

grant select on all tables in schema aggregates to service_role;
