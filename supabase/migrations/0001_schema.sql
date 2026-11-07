-- Criticaller schema (spec section 4)
create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('user','figure')),
  handle text not null unique,
  display_name text not null,
  bio text,
  avatar_url text,
  claimed_by_user uuid references auth.users(id) on delete set null,
  is_moderator boolean not null default false,
  created_at timestamptz not null default now()
);
-- User profiles share their id with auth.users; figures get a random id.
create index profiles_kind_idx on profiles(kind);

create table calls (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  caller_id uuid not null references profiles(id) on delete cascade,
  origin text not null check (origin in ('native','seeded','receipt')),
  title text not null,
  subject text not null,
  predicate text not null,
  deadline date not null,
  reasoning text,
  success_if text not null,
  failure_if text not null,
  confidence int check (confidence between 1 and 99),
  confidence_source text not null default 'stated' check (confidence_source in ('stated','inferred','none')),
  confidence_quote text,
  topic text check (topic in ('politics','tech','science','economics','sports','entertainment')),
  source_url text,
  source_quote text,
  source_published_at timestamptz,
  verified boolean not null default false,
  counts_toward_score boolean not null default true,
  status text not null default 'open' check (status in ('open','pending','proposed','contested','resolved')),
  outcome text check (outcome in ('true','false','void')),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint receipts_never_score check (origin <> 'receipt' or counts_toward_score = false),
  constraint confidence_matches_source check (confidence_source = 'none' or confidence is not null)
);
create index calls_caller_idx on calls(caller_id);
create index calls_status_deadline_idx on calls(status, deadline);

create table critiques (
  call_id uuid not null references calls(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  confidence int not null check (confidence between 1 and 99),
  updated_at timestamptz not null default now(),
  primary key (call_id, user_id)
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references calls(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  critique_snapshot int check (critique_snapshot between 1 and 99),
  created_at timestamptz not null default now(),
  deleted boolean not null default false
);
create index comments_call_idx on comments(call_id);

create table votes (
  user_id uuid not null references profiles(id) on delete cascade,
  target_type text not null check (target_type in ('call','comment')),
  target_id uuid not null,
  value int not null check (value in (-1,1)),
  primary key (user_id, target_type, target_id)
);

create table resolutions (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references calls(id) on delete cascade,
  proposed_outcome text not null check (proposed_outcome in ('true','false','void')),
  rationale text,
  evidence jsonb not null default '[]',
  proposed_by text not null check (proposed_by in ('ai','moderator')),
  model text,
  ai_certainty int check (ai_certainty between 0 and 100),
  raw_output jsonb,
  status text not null default 'proposed' check (status in ('proposed','final','overturned')),
  finalize_at timestamptz,
  created_at timestamptz not null default now()
);
create index resolutions_call_idx on resolutions(call_id);

create table flags (
  id uuid primary key default gen_random_uuid(),
  resolution_id uuid not null references resolutions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open','upheld','rejected')),
  created_at timestamptz not null default now()
);

create table seed_candidates (
  id uuid primary key default gen_random_uuid(),
  source_url text,
  source_text text,
  figure_name text,
  extracted jsonb,
  qualifies boolean not null default false,
  disqualify_reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile when a user signs up.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  base text := lower(regexp_replace(split_part(coalesce(new.email, new.id::text), '@', 1), '[^a-z0-9_]', '', 'gi'));
  candidate text;
begin
  if base = '' then base := 'user'; end if;
  candidate := base;
  while exists (select 1 from profiles where handle = candidate) loop
    candidate := base || floor(random() * 10000)::int;
  end loop;
  insert into profiles (id, kind, handle, display_name, avatar_url)
  values (new.id, 'user', candidate,
          coalesce(new.raw_user_meta_data->>'full_name', base),
          new.raw_user_meta_data->>'avatar_url');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Lock rule (spec section 5): core fields are immutable 10 minutes after publish.
create function enforce_call_lock() returns trigger
language plpgsql as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if now() - old.created_at > interval '10 minutes' and (
       new.subject is distinct from old.subject or new.predicate is distinct from old.predicate or
       new.deadline is distinct from old.deadline or new.success_if is distinct from old.success_if or
       new.failure_if is distinct from old.failure_if or new.confidence is distinct from old.confidence
     ) then
    raise exception 'Call is locked: core fields cannot be edited 10 minutes after publishing';
  end if;
  return new;
end $$;

create trigger calls_lock before update on calls
  for each row execute function enforce_call_lock();
