-- Projects: someone with an idea for a night (a fan, an artist or an organiser: no craft needed)
-- says what it needs (investment, sponsors, artists, a venue, a partner to run it), and others
-- offer. FeestFinder connects them and never takes, holds or moves money: an offer is an intent,
-- and once the owner accepts it both sides see each other's contact and agree the rest between
-- them. The team reviews a project before it is public, as it does listings. Amounts are whole
-- units of `currency`, the project city's.

create table projects (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9-]{3,90}$'),
  owner_user_id  uuid not null references users on delete cascade,
  title          text not null,
  pitch          text not null default '',
  story          text not null default '',
  city           text not null references cities,
  styles         text[] not null default '{}',
  event_type     text check (event_type in ('club', 'festival', 'concert', 'rave', 'party', 'show', 'other')),
  target_on      date,
  capacity       int check (capacity > 0),
  budget         bigint check (budget >= 0),
  raise_amount   bigint check (raise_amount >= 0),
  currency       text not null check (currency ~ '^[A-Z]{3}$'),
  seeking        text[] not null default '{}' check (seeking <@ array['investment', 'sponsorship', 'artists', 'venue', 'partner']),
  cover_url      text,
  status         text not null default 'draft' check (status in ('draft', 'in_review', 'open', 'closed', 'realized', 'rejected')),
  event_id       uuid references events on delete set null,
  decision_note  text,
  decided_by     uuid references users on delete set null,
  decided_at     timestamptz,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index projects_public on projects (published_at desc) where status in ('open', 'realized');
create index projects_review on projects (updated_at) where status = 'in_review';
create index projects_owner on projects (owner_user_id, created_at desc);
create index projects_event on projects (event_id) where event_id is not null;

-- What a sponsor gets for an amount: a package the owner offers.
create table project_packages (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects on delete cascade,
  title       text not null,
  amount      bigint not null check (amount >= 0),
  perks       text not null default '',
  slots       int check (slots > 0),
  sort        int not null default 0
);
create index project_packages_project on project_packages (project_id, sort);

-- An offer to take part: invest, sponsor, perform, host (a venue) or run it with the owner.
create table project_offers (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects on delete cascade,
  user_id      uuid not null references users on delete cascade,
  kind         text not null check (kind in ('invest', 'sponsor', 'perform', 'venue', 'partner')),
  org_name     text,
  artist_id    uuid references artists on delete set null,
  package_id   uuid references project_packages on delete set null,
  amount       bigint check (amount >= 0),
  message      text not null default '',
  status       text not null default 'sent' check (status in ('sent', 'accepted', 'declined', 'withdrawn')),
  created_at   timestamptz not null default now(),
  decided_at   timestamptz
);
create unique index project_offers_open on project_offers (project_id, user_id, kind) where status in ('sent', 'accepted');
create index project_offers_project on project_offers (project_id, created_at desc);
create index project_offers_user on project_offers (user_id, created_at desc);

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
