-- One account, several personas: anyone is a music fan; some also perform, some also organise.
--
-- 1. user_roles holds the personas a person opted into. Being a fan needs no row. Admin is
--    never a row here: it comes from the ADMIN_EMAIL allowlist (bootstrap.ts, auth.ts).
--    'pending' waits on a claim the team decides; 'disabled' hides the workspace and keeps
--    everything the persona is linked to.
-- 2. An artist profile can have one owner. A person either starts a new profile or claims
--    the one events already list them under; the team decides claims, as for event claims.
-- 3. An organiser is claimed the same way; approving adds the person to organizer_members.
-- 4. A session remembers how it was signed in, so admin rights can require Google.
-- 5. See below: email verification.

create table user_roles (
  user_id     uuid not null references users on delete cascade,
  role        text not null check (role in ('artist', 'organizer')),
  status      text not null default 'active' check (status in ('active', 'pending', 'disabled')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, role)
);

alter table users add column onboarded_at timestamptz;
-- Accounts that were here before the role picker existed are not asked again.
update users set onboarded_at = created_at;

alter table artists add column owner_user_id uuid references users on delete set null;
create unique index artists_owner on artists (owner_user_id) where owner_user_id is not null;

create table artist_claims (
  id            uuid primary key default gen_random_uuid(),
  artist_id     uuid not null references artists on delete cascade,
  user_id       uuid not null references users on delete cascade,
  note          text not null default '',
  proof_url     text,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz not null default now(),
  decided_at    timestamptz,
  decided_by    uuid references users on delete set null,
  decision_note text
);
create unique index artist_claims_open on artist_claims (artist_id, user_id) where status = 'pending';

create table organizer_claims (
  id            uuid primary key default gen_random_uuid(),
  organizer_id  uuid not null references organizers on delete cascade,
  user_id       uuid not null references users on delete cascade,
  note          text not null default '',
  proof_url     text,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz not null default now(),
  decided_at    timestamptz,
  decided_by    uuid references users on delete set null,
  decision_note text
);
create unique index organizer_claims_open on organizer_claims (organizer_id, user_id) where status = 'pending';

-- Existing organiser members already organise.
insert into user_roles (user_id, role, status)
select distinct user_id, 'organizer', 'active' from organizer_members
on conflict do nothing;

alter table sessions add column method text;

-- 5. Whether an account's email was proven (an email code, or Google/Facebook confirming it).
--    An address typed into a profile is not, and never finds or upgrades an account.
alter table users add column email_verified_at timestamptz;
update users set email_verified_at = created_at where email is not null and signup_method in ('email', 'google', 'fb');

do $$
declare
  t record;
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    for t in select tablename from pg_tables where schemaname = 'public' loop
      execute format('alter table public.%I enable row level security', t.tablename);
    end loop;
    revoke all on all tables in schema public from anon, authenticated;
    revoke all on all sequences in schema public from anon, authenticated;
  end if;
end $$;
