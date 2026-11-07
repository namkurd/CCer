-- Row Level Security (spec section 4): anyone reads; users write only their own;
-- seeding, resolution finalization and moderation go through moderators / service role.

create function is_moderator() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_moderator from profiles where id = auth.uid()), false)
$$;

alter table profiles enable row level security;
alter table calls enable row level security;
alter table critiques enable row level security;
alter table comments enable row level security;
alter table votes enable row level security;
alter table resolutions enable row level security;
alter table flags enable row level security;
alter table seed_candidates enable row level security;

-- Public read
create policy "read profiles" on profiles for select using (true);
create policy "read calls" on calls for select using (true);
create policy "read critiques" on critiques for select using (true);
create policy "read comments" on comments for select using (true);
create policy "read votes" on votes for select using (true);
create policy "read resolutions" on resolutions for select using (true);
create policy "read flags" on flags for select using (true);

-- Profiles: users edit their own row but cannot grant themselves moderator/kind/claim.
create policy "update own profile" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create function protect_profile_fields() returns trigger
language plpgsql as $$
begin
  if auth.role() <> 'service_role' and (
       new.is_moderator is distinct from old.is_moderator or
       new.kind is distinct from old.kind or
       new.claimed_by_user is distinct from old.claimed_by_user) then
    raise exception 'Not allowed to change protected profile fields';
  end if;
  return new;
end $$;
create trigger profiles_protect before update on profiles
  for each row execute function protect_profile_fields();

-- Calls: users create native calls as themselves. Seeded/receipt rows come from moderators/service role.
create policy "insert own native call" on calls for insert to authenticated
  with check (caller_id = auth.uid() and origin = 'native' and counts_toward_score = true
              and status = 'open' and outcome is null and verified = false);
create policy "update own open call" on calls for update to authenticated
  using (caller_id = auth.uid() and status = 'open')
  with check (caller_id = auth.uid() and status = 'open' and outcome is null);
create policy "moderators manage calls" on calls for all to authenticated
  using (is_moderator()) with check (is_moderator());

-- Critiques: own only, editable until the deadline.
create policy "insert own critique" on critiques for insert to authenticated
  with check (user_id = auth.uid()
    and exists (select 1 from calls c where c.id = call_id and c.deadline >= current_date and c.status = 'open'));
create policy "update own critique" on critiques for update to authenticated
  using (user_id = auth.uid()
    and exists (select 1 from calls c where c.id = call_id and c.deadline >= current_date and c.status = 'open'))
  with check (user_id = auth.uid());

-- Comments
create policy "insert own comment" on comments for insert to authenticated
  with check (user_id = auth.uid() and deleted = false);
create policy "moderators moderate comments" on comments for update to authenticated
  using (is_moderator()) with check (is_moderator());

-- Votes: own only; toggle = delete.
create policy "insert own vote" on votes for insert to authenticated with check (user_id = auth.uid());
create policy "update own vote" on votes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own vote" on votes for delete to authenticated using (user_id = auth.uid());

-- Resolutions: written by service role (AI) or moderators only.
create policy "moderators manage resolutions" on resolutions for all to authenticated
  using (is_moderator()) with check (is_moderator());

-- Flags: any user flags as themselves; moderators decide.
create policy "insert own flag" on flags for insert to authenticated
  with check (user_id = auth.uid() and status = 'open');
create policy "moderators decide flags" on flags for update to authenticated
  using (is_moderator()) with check (is_moderator());

-- Seed queue: moderators only (service role bypasses RLS).
create policy "moderators manage seed queue" on seed_candidates for all to authenticated
  using (is_moderator()) with check (is_moderator());
