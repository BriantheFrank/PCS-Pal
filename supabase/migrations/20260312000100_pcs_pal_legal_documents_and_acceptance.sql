-- PCS Pal versioned legal documents, acceptance evidence, and email signup capture.
-- Additive only. Existing auth and profile data remain intact.

create extension if not exists pgcrypto;

create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null,
  title text not null,
  version text not null,
  effective_date date not null,
  url text not null,
  content_hash text not null,
  review_status text not null default 'draft_pending_attorney_review',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint legal_documents_doc_type_check
    check (doc_type in ('terms_of_use', 'privacy_policy')),
  constraint legal_documents_review_status_check
    check (review_status in ('draft_pending_attorney_review', 'attorney_reviewed', 'placeholder')),
  constraint legal_documents_version_length_check
    check (char_length(version) between 1 and 64),
  constraint legal_documents_title_length_check
    check (char_length(title) between 1 and 160),
  constraint legal_documents_url_length_check
    check (char_length(url) between 1 and 255),
  constraint legal_documents_content_hash_length_check
    check (char_length(content_hash) between 32 and 128),
  unique (doc_type, version)
);

comment on table public.legal_documents is
  'Versioned legal document registry for PCS Pal. Insert a new row for each new Terms of Use or Privacy Policy version.';

comment on column public.legal_documents.content_hash is
  'Snapshot hash of the public document file for auditability. Recompute whenever a material legal version changes.';

create unique index if not exists idx_legal_documents_one_active_per_type
  on public.legal_documents (doc_type)
  where is_active = true;

create index if not exists idx_legal_documents_doc_type_effective_date
  on public.legal_documents (doc_type, effective_date desc);

create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.legal_documents(id) on delete restrict,
  accepted_at timestamptz not null,
  acceptance_method text not null,
  source_flow text not null,
  ip_hash text,
  ip_hash_method text,
  user_agent text,
  session_id text,
  document_version text not null,
  document_url text not null,
  document_content_hash text not null,
  created_at timestamptz not null default now(),
  constraint legal_acceptances_acceptance_method_length_check
    check (char_length(acceptance_method) between 1 and 64),
  constraint legal_acceptances_source_flow_length_check
    check (char_length(source_flow) between 1 and 64),
  constraint legal_acceptances_ip_hash_length_check
    check (ip_hash is null or char_length(ip_hash) between 32 and 128),
  constraint legal_acceptances_ip_hash_method_length_check
    check (ip_hash_method is null or char_length(ip_hash_method) between 1 and 64),
  constraint legal_acceptances_user_agent_length_check
    check (user_agent is null or char_length(user_agent) <= 512),
  constraint legal_acceptances_session_id_length_check
    check (session_id is null or char_length(session_id) <= 128),
  constraint legal_acceptances_snapshot_version_length_check
    check (char_length(document_version) between 1 and 64),
  constraint legal_acceptances_snapshot_hash_length_check
    check (char_length(document_content_hash) between 32 and 128)
);

comment on table public.legal_acceptances is
  'Audit log of which versioned legal documents a user accepted, when they accepted them, and the minimal request metadata captured at that time.';

comment on column public.legal_acceptances.ip_hash is
  'Hashed IP snapshot captured at signup or re-acceptance. Prefer a salted hash before production legal launch.';

create index if not exists idx_legal_acceptances_user_id
  on public.legal_acceptances (user_id);

create index if not exists idx_legal_acceptances_document_id
  on public.legal_acceptances (document_id);

create index if not exists idx_legal_acceptances_user_document_timestamp
  on public.legal_acceptances (user_id, document_id, accepted_at desc);

create or replace function public.get_current_user_legal_status()
returns table (
  doc_type text,
  title text,
  current_version text,
  current_url text,
  effective_date date,
  review_status text,
  accepted_version text,
  accepted_at timestamptz,
  acceptance_method text,
  needs_reacceptance boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with current_docs as (
    select
      legal_documents.id,
      legal_documents.doc_type,
      legal_documents.title,
      legal_documents.version,
      legal_documents.url,
      legal_documents.effective_date,
      legal_documents.review_status
    from public.legal_documents
    where legal_documents.is_active = true
  ),
  latest_acceptances as (
    select distinct on (documents.doc_type)
      documents.doc_type,
      acceptances.document_version,
      acceptances.accepted_at,
      acceptances.acceptance_method
    from public.legal_acceptances as acceptances
    join public.legal_documents as documents
      on documents.id = acceptances.document_id
    where acceptances.user_id = auth.uid()
    order by documents.doc_type, acceptances.accepted_at desc, acceptances.created_at desc
  )
  select
    current_docs.doc_type,
    current_docs.title,
    current_docs.version as current_version,
    current_docs.url as current_url,
    current_docs.effective_date,
    current_docs.review_status,
    latest_acceptances.document_version as accepted_version,
    latest_acceptances.accepted_at,
    latest_acceptances.acceptance_method,
    coalesce(latest_acceptances.document_version <> current_docs.version, true) as needs_reacceptance
  from current_docs
  left join latest_acceptances
    on latest_acceptances.doc_type = current_docs.doc_type
  where auth.uid() is not null;
$$;

comment on function public.get_current_user_legal_status() is
  'Returns the signed-in user''s current Terms and Privacy version status to support account visibility and future re-consent prompts.';

create or replace function public.record_current_legal_acceptance(
  accepted_terms_version text,
  accepted_privacy_version text,
  acceptance_method text default 'account_reacceptance',
  source_flow text default 'account_settings',
  ip_hash text default null,
  ip_hash_method text default null,
  user_agent text default null,
  session_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_terms public.legal_documents%rowtype;
  current_privacy public.legal_documents%rowtype;
  accepted_timestamp timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select *
  into current_terms
  from public.legal_documents
  where doc_type = 'terms_of_use'
    and is_active = true
  limit 1;

  if current_terms.id is null then
    raise exception 'Current Terms of Use document is not configured.';
  end if;

  select *
  into current_privacy
  from public.legal_documents
  where doc_type = 'privacy_policy'
    and is_active = true
  limit 1;

  if current_privacy.id is null then
    raise exception 'Current Privacy Policy document is not configured.';
  end if;

  if accepted_terms_version is distinct from current_terms.version then
    raise exception 'The Terms of Use version is no longer current.';
  end if;

  if accepted_privacy_version is distinct from current_privacy.version then
    raise exception 'The Privacy Policy version is no longer current.';
  end if;

  insert into public.legal_acceptances (
    user_id,
    document_id,
    accepted_at,
    acceptance_method,
    source_flow,
    ip_hash,
    ip_hash_method,
    user_agent,
    session_id,
    document_version,
    document_url,
    document_content_hash
  )
  values
    (
      auth.uid(),
      current_terms.id,
      accepted_timestamp,
      acceptance_method,
      source_flow,
      ip_hash,
      ip_hash_method,
      left(user_agent, 512),
      left(session_id, 128),
      current_terms.version,
      current_terms.url,
      current_terms.content_hash
    ),
    (
      auth.uid(),
      current_privacy.id,
      accepted_timestamp,
      acceptance_method,
      source_flow,
      ip_hash,
      ip_hash_method,
      left(user_agent, 512),
      left(session_id, 128),
      current_privacy.version,
      current_privacy.url,
      current_privacy.content_hash
    );

  return jsonb_build_object(
    'accepted_at',
    accepted_timestamp,
    'terms_version',
    current_terms.version,
    'privacy_version',
    current_privacy.version
  );
end;
$$;

comment on function public.record_current_legal_acceptance(text, text, text, text, text, text, text, text) is
  'Creates acceptance rows for the currently active Terms of Use and Privacy Policy after a signed-in user affirmatively acknowledges them.';

create or replace function public.capture_auth_signup_legal_state()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  auth_provider text := coalesce(new.raw_app_meta_data ->> 'provider', '');
  signup_source text := coalesce(new.raw_user_meta_data ->> 'signup_source', '');
  legal_acceptance jsonb := new.raw_user_meta_data -> 'legal_acceptance';
  accepted_terms_version text := coalesce(legal_acceptance ->> 'terms_version', '');
  accepted_privacy_version text := coalesce(legal_acceptance ->> 'privacy_version', '');
  marketing_consent_value boolean := coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false);
  full_name_value text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), '');
  accepted_timestamp timestamptz := now();
  terms_document public.legal_documents%rowtype;
  privacy_document public.legal_documents%rowtype;
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    marketing_consent
  )
  values (
    new.id,
    new.email,
    full_name_value,
    marketing_consent_value
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    marketing_consent = excluded.marketing_consent;

  if auth_provider <> 'email'
    and signup_source <> 'create_account_page'
    and legal_acceptance is null then
    return new;
  end if;

  if legal_acceptance is null then
    raise exception 'Legal acknowledgment metadata is required for account creation.';
  end if;

  if accepted_terms_version = '' or accepted_privacy_version = '' then
    raise exception 'Current Terms and Privacy versions are required for account creation.';
  end if;

  select *
  into terms_document
  from public.legal_documents
  where doc_type = 'terms_of_use'
    and version = accepted_terms_version
    and is_active = true
  limit 1;

  if terms_document.id is null then
    raise exception 'The selected Terms of Use version is no longer active.';
  end if;

  select *
  into privacy_document
  from public.legal_documents
  where doc_type = 'privacy_policy'
    and version = accepted_privacy_version
    and is_active = true
  limit 1;

  if privacy_document.id is null then
    raise exception 'The selected Privacy Policy version is no longer active.';
  end if;

  begin
    accepted_timestamp := coalesce((legal_acceptance ->> 'accepted_at')::timestamptz, now());
  exception
    when others then
      accepted_timestamp := now();
  end;

  insert into public.legal_acceptances (
    user_id,
    document_id,
    accepted_at,
    acceptance_method,
    source_flow,
    ip_hash,
    ip_hash_method,
    user_agent,
    session_id,
    document_version,
    document_url,
    document_content_hash
  )
  values
    (
      new.id,
      terms_document.id,
      accepted_timestamp,
      coalesce(nullif(legal_acceptance ->> 'acceptance_method', ''), 'signup_checkbox'),
      signup_source,
      nullif(legal_acceptance ->> 'ip_hash', ''),
      nullif(legal_acceptance ->> 'ip_hash_method', ''),
      left(coalesce(legal_acceptance ->> 'user_agent', ''), 512),
      left(coalesce(legal_acceptance ->> 'session_id', ''), 128),
      terms_document.version,
      terms_document.url,
      terms_document.content_hash
    ),
    (
      new.id,
      privacy_document.id,
      accepted_timestamp,
      coalesce(nullif(legal_acceptance ->> 'acceptance_method', ''), 'signup_checkbox'),
      signup_source,
      nullif(legal_acceptance ->> 'ip_hash', ''),
      nullif(legal_acceptance ->> 'ip_hash_method', ''),
      left(coalesce(legal_acceptance ->> 'user_agent', ''), 512),
      left(coalesce(legal_acceptance ->> 'session_id', ''), 128),
      privacy_document.version,
      privacy_document.url,
      privacy_document.content_hash
    );

  return new;
end;
$$;

comment on function public.capture_auth_signup_legal_state() is
  'On auth.users insert, captures the signup legal acceptance snapshot from signup metadata, enforces it for email signups, and seeds the user profile marketing preference.';

drop trigger if exists trg_legal_documents_updated_at on public.legal_documents;
create trigger trg_legal_documents_updated_at
before update on public.legal_documents
for each row
execute function public.set_updated_at();

drop trigger if exists trg_auth_users_capture_legal_state on auth.users;
create trigger trg_auth_users_capture_legal_state
after insert on auth.users
for each row
execute function public.capture_auth_signup_legal_state();

alter table public.legal_documents enable row level security;
alter table public.legal_acceptances enable row level security;

drop policy if exists "legal_documents_public_read" on public.legal_documents;
create policy "legal_documents_public_read"
on public.legal_documents
for select
using (true);

drop policy if exists "legal_acceptances_select_own" on public.legal_acceptances;
create policy "legal_acceptances_select_own"
on public.legal_acceptances
for select
using (user_id = auth.uid());

revoke all on function public.get_current_user_legal_status() from public, anon;
grant execute on function public.get_current_user_legal_status() to authenticated;

revoke all on function public.record_current_legal_acceptance(text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.record_current_legal_acceptance(text, text, text, text, text, text, text, text) to authenticated;

insert into public.legal_documents (
  doc_type,
  title,
  version,
  effective_date,
  url,
  content_hash,
  review_status,
  is_active
)
values
  (
    'terms_of_use',
    'Terms of Use',
    '2026-03-12',
    date '2026-03-12',
    'terms-of-use.html',
    '7FD6FCADAE2F871BD3108ADE7ABB919053F1807FFDBEE17F36ADFE3407A4393A',
    'draft_pending_attorney_review',
    true
  ),
  (
    'privacy_policy',
    'Privacy Policy',
    '2026-03-12',
    date '2026-03-12',
    'privacy-policy.html',
    '663B7960A628D23CDA55AF12C6F17E46582B92B12CE46FF21B76882C280D34C5',
    'draft_pending_attorney_review',
    true
  )
on conflict (doc_type, version) do update
set
  title = excluded.title,
  effective_date = excluded.effective_date,
  url = excluded.url,
  content_hash = excluded.content_hash,
  review_status = excluded.review_status,
  is_active = excluded.is_active;

update public.legal_documents
set is_active = false
where doc_type = 'terms_of_use'
  and version <> '2026-03-12';

update public.legal_documents
set is_active = false
where doc_type = 'privacy_policy'
  and version <> '2026-03-12';
