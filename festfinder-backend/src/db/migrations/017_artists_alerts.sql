-- Artists as records of their own, and Smart Alerts by city and music style.
--
-- 1. An artist is one row however each event spells them ("Peggy Gou", "PEGGY GOU"): the
--    accent-free, lower-case name is the identity. events.artists stays the list an
--    organiser typed; event_artists links each name to its artist, kept in step on every
--    save (services/artists.ts). Existing events are linked after this migration runs.
-- 2. artist_follows still follows a name, so a follow made before this keeps working.

create table artists (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  name             text not null,
  normalized_name  text not null unique,
  aliases          text[] not null default '{}',
  bio              jsonb not null default '{"en":"","vi":""}',
  image_url        text,
  website          text,
  created_at       timestamptz not null default now()
);

create table event_artists (
  event_id   uuid not null references events on delete cascade,
  artist_id  uuid not null references artists on delete cascade,
  sort       int not null default 0,
  primary key (event_id, artist_id)
);
create index event_artists_artist on event_artists (artist_id);

alter table smart_alerts add column cities text[] not null default '{}';
alter table smart_alerts add column styles text[] not null default '{}';

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
