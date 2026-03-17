-- PCS Pal user feedback intake and weekly digest tracking.
-- Feedback is accepted through the Next.js server layer, not through direct client table access.

create extension if not exists pgcrypto;

create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  follow_up_email text,
  feedback_type text not null,
  title text not null,
  message text not null,
  page_path text not null,
  browser_context jsonb not null default '{}'::jsonb,
  experience_rating smallint,
  status text not null default 'new',
  admin_notes text,
  source text not null default 'web',
  ip_hash text,
  constraint feedback_submissions_feedback_type_check
    check (feedback_type in ('bug_problem', 'feature_request', 'general_feedback')),
  constraint feedback_submissions_title_length_check
    check (char_length(title) between 4 and 120),
  constraint feedback_submissions_message_length_check
    check (char_length(message) between 12 and 4000),
  constraint feedback_submissions_page_path_length_check
    check (char_length(page_path) between 1 and 255),
  constraint feedback_submissions_user_email_length_check
    check (user_email is null or char_length(user_email) between 3 and 320),
  constraint feedback_submissions_follow_up_email_length_check
    check (follow_up_email is null or char_length(follow_up_email) between 3 and 320),
  constraint feedback_submissions_status_check
    check (status in ('new', 'reviewed', 'archived')),
  constraint feedback_submissions_source_length_check
    check (char_length(source) between 1 and 32),
  constraint feedback_submissions_rating_check
    check (experience_rating is null or experience_rating between 1 and 5),
  constraint feedback_submissions_ip_hash_length_check
    check (ip_hash is null or char_length(ip_hash) between 32 and 128)
);

comment on table public.feedback_submissions is
  'User-submitted product feedback collected through the PCS Pal web app. Writes are intentionally routed through the Next.js server layer.';

comment on column public.feedback_submissions.browser_context is
  'Small JSON snapshot of browser and viewport context captured by the client at submission time.';

comment on column public.feedback_submissions.ip_hash is
  'Hashed request IP used for coarse abuse controls. Store only a hash, never the raw client IP.';

create index if not exists idx_feedback_submissions_created_at
  on public.feedback_submissions (created_at desc);

create index if not exists idx_feedback_submissions_status_created_at
  on public.feedback_submissions (status, created_at desc);

create index if not exists idx_feedback_submissions_feedback_type_created_at
  on public.feedback_submissions (feedback_type, created_at desc);

create index if not exists idx_feedback_submissions_user_id_created_at
  on public.feedback_submissions (user_id, created_at desc);

create index if not exists idx_feedback_submissions_page_path_created_at
  on public.feedback_submissions (page_path, created_at desc);

create index if not exists idx_feedback_submissions_ip_hash_created_at
  on public.feedback_submissions (ip_hash, created_at desc);

drop trigger if exists trg_feedback_submissions_updated_at on public.feedback_submissions;
create trigger trg_feedback_submissions_updated_at
before update on public.feedback_submissions
for each row
execute function public.set_updated_at();

create table if not exists public.feedback_digest_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  window_start timestamptz not null,
  window_end timestamptz not null,
  recipient_email text not null default 'athenaeumgroupllc@gmail.com',
  status text not null default 'pending',
  feedback_count integer not null default 0,
  summary_json jsonb not null default '{}'::jsonb,
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  constraint feedback_digest_runs_window_check
    check (window_end > window_start),
  constraint feedback_digest_runs_status_check
    check (status in ('pending', 'sent', 'failed')),
  constraint feedback_digest_runs_feedback_count_check
    check (feedback_count >= 0),
  constraint feedback_digest_runs_recipient_email_length_check
    check (char_length(recipient_email) between 3 and 320),
  unique (window_start, window_end)
);

comment on table public.feedback_digest_runs is
  'Operational log of weekly feedback digest attempts so the Vercel cron can avoid duplicate sends.';

create index if not exists idx_feedback_digest_runs_status_created_at
  on public.feedback_digest_runs (status, created_at desc);

drop trigger if exists trg_feedback_digest_runs_updated_at on public.feedback_digest_runs;
create trigger trg_feedback_digest_runs_updated_at
before update on public.feedback_digest_runs
for each row
execute function public.set_updated_at();

alter table public.feedback_submissions enable row level security;
alter table public.feedback_digest_runs enable row level security;

drop policy if exists "feedback_submissions_select_own" on public.feedback_submissions;
create policy "feedback_submissions_select_own"
on public.feedback_submissions
for select
using (user_id = auth.uid());

grant select on public.feedback_submissions to authenticated;
revoke insert, update, delete on public.feedback_submissions from anon, authenticated;
revoke all on public.feedback_digest_runs from anon, authenticated;
