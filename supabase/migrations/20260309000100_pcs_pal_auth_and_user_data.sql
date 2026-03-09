-- PCS-Pal auth and user-owned data model
-- This migration is additive and keeps existing localStorage keys untouched.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_checklist_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checklist_key text not null,
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, checklist_key)
);

create table if not exists public.user_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.user_move_logistics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists idx_user_checklist_state_user_id
  on public.user_checklist_state (user_id);

create index if not exists idx_user_inventory_user_id
  on public.user_inventory (user_id);

create index if not exists idx_user_move_logistics_user_id
  on public.user_move_logistics (user_id);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_user_checklist_state_updated_at on public.user_checklist_state;
create trigger trg_user_checklist_state_updated_at
before update on public.user_checklist_state
for each row
execute function public.set_updated_at();

drop trigger if exists trg_user_inventory_updated_at on public.user_inventory;
create trigger trg_user_inventory_updated_at
before update on public.user_inventory
for each row
execute function public.set_updated_at();

drop trigger if exists trg_user_move_logistics_updated_at on public.user_move_logistics;
create trigger trg_user_move_logistics_updated_at
before update on public.user_move_logistics
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_checklist_state enable row level security;
alter table public.user_inventory enable row level security;
alter table public.user_move_logistics enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles
for delete
using (id = auth.uid());

drop policy if exists "checklist_select_own" on public.user_checklist_state;
create policy "checklist_select_own"
on public.user_checklist_state
for select
using (user_id = auth.uid());

drop policy if exists "checklist_insert_own" on public.user_checklist_state;
create policy "checklist_insert_own"
on public.user_checklist_state
for insert
with check (user_id = auth.uid());

drop policy if exists "checklist_update_own" on public.user_checklist_state;
create policy "checklist_update_own"
on public.user_checklist_state
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "checklist_delete_own" on public.user_checklist_state;
create policy "checklist_delete_own"
on public.user_checklist_state
for delete
using (user_id = auth.uid());

drop policy if exists "inventory_select_own" on public.user_inventory;
create policy "inventory_select_own"
on public.user_inventory
for select
using (user_id = auth.uid());

drop policy if exists "inventory_insert_own" on public.user_inventory;
create policy "inventory_insert_own"
on public.user_inventory
for insert
with check (user_id = auth.uid());

drop policy if exists "inventory_update_own" on public.user_inventory;
create policy "inventory_update_own"
on public.user_inventory
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "inventory_delete_own" on public.user_inventory;
create policy "inventory_delete_own"
on public.user_inventory
for delete
using (user_id = auth.uid());

drop policy if exists "logistics_select_own" on public.user_move_logistics;
create policy "logistics_select_own"
on public.user_move_logistics
for select
using (user_id = auth.uid());

drop policy if exists "logistics_insert_own" on public.user_move_logistics;
create policy "logistics_insert_own"
on public.user_move_logistics
for insert
with check (user_id = auth.uid());

drop policy if exists "logistics_update_own" on public.user_move_logistics;
create policy "logistics_update_own"
on public.user_move_logistics
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "logistics_delete_own" on public.user_move_logistics;
create policy "logistics_delete_own"
on public.user_move_logistics
for delete
using (user_id = auth.uid());
