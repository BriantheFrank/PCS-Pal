create table if not exists public.inventory_extraction_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  move_id uuid not null references public.moves(id) on delete cascade,
  room_id text not null,
  model text not null,
  status text not null check (status in ('processing', 'succeeded', 'failed')),
  requested_photo_count integer not null default 0 check (requested_photo_count >= 0 and requested_photo_count <= 32),
  payload_size_bytes integer not null default 0 check (payload_size_bytes >= 0),
  error_code text,
  summary_jsonb jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_inventory_extraction_jobs_user_id_created_at
  on public.inventory_extraction_jobs (user_id, created_at desc);

create index if not exists idx_inventory_extraction_jobs_move_room
  on public.inventory_extraction_jobs (move_id, room_id, created_at desc);

alter table public.inventory_extraction_jobs enable row level security;

drop policy if exists "inventory_extraction_jobs_select_own" on public.inventory_extraction_jobs;
create policy "inventory_extraction_jobs_select_own"
on public.inventory_extraction_jobs
for select
using (user_id = auth.uid());

drop policy if exists "inventory_extraction_jobs_insert_own" on public.inventory_extraction_jobs;
create policy "inventory_extraction_jobs_insert_own"
on public.inventory_extraction_jobs
for insert
with check (user_id = auth.uid());
