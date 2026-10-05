-- The artist and organiser network: who an artist is and how to book them, what an organiser
-- does and where, and Rock as a genre of its own (it used to be filed under Indie).
--
-- What these profiles link to (upcoming gigs, organisers worked with, venues, shared lineups)
-- is never stored here: it is read from canonical events (services/network.ts).

-- ---- artists -------------------------------------------------------------------------------

alter table artists add column artist_roles  text[] not null default '{}'
  check (artist_roles <@ array['dj', 'producer', 'live', 'band', 'vocalist']::text[]);
alter table artists add column based_city    text references cities;
alter table artists add column based_country text references countries;
alter table artists add column languages     text[] not null default '{}';
alter table artists add column active_since  int check (active_since between 1950 and 2100);
-- In order: the first is the primary style.
alter table artists add column styles        text[] not null default '{}';
alter table artists add column booking_status text check (booking_status in ('available', 'limited', 'touring', 'unavailable'));
alter table artists add column travel_scope  text check (travel_scope in ('local', 'domestic', 'southeast_asia', 'asia', 'worldwide'));
alter table artists add column gig_types     text[] not null default '{}'
  check (gig_types <@ array['club', 'festival', 'rave', 'concert', 'brand_event', 'private', 'support', 'headline', 'b2b']::text[]);
alter table artists add column set_lengths   text[] not null default '{}'
  check (set_lengths <@ array['60', '90', '120', 'open_format', 'all_night_long']::text[]);
-- Streaming and social pages, by a fixed list of keys (lib/network.ts).
alter table artists add column links         jsonb not null default '{}';
-- Identity anchors, filled once verified: they beat a name match.
alter table artists add column musicbrainz_id text;
alter table artists add column wikidata_id   text;
alter table artists add column spotify_id    text;
alter table artists add column cover_url     text;
alter table artists add column open_to_brands boolean not null default false;
alter table artists add column verified      boolean not null default false;
alter table artists add column updated_at    timestamptz not null default now();
-- Other names an artist goes by ("DJ Mie" for "Mie"), as matched: accent-free, lower case.
-- `aliases` keeps how they are written, which is what follows use.
alter table artists add column alias_keys    text[] not null default '{}';

create index artists_based_city on artists (based_city);
create index artists_styles on artists using gin (styles);
create unique index artists_musicbrainz on artists (musicbrainz_id) where musicbrainz_id is not null;
create unique index artists_spotify on artists (spotify_id) where spotify_id is not null;

-- ---- organisers ----------------------------------------------------------------------------

alter table organizers drop constraint organizers_type_check;
alter table organizers add constraint organizers_type_check
  check (type in ('promoter', 'venue', 'festival', 'agency', 'collective', 'independent', 'company', 'public'));
-- The cities it runs events in.
alter table organizers add column markets text[] not null default '{}';
alter table organizers add column styles  text[] not null default '{}';
alter table organizers add column open_for_submissions boolean not null default false;
alter table organizers add column cover_url text;
alter table organizers add column links   jsonb not null default '{}';

-- An organiser already running events somewhere has that market.
update organizers o set markets = coalesce((select array_agg(distinct e.city) from events e where e.organizer_id = o.id and e.city is not null), '{}');

-- ---- Rock --------------------------------------------------------------------------------

alter table events drop constraint events_genre_check;
alter table events add constraint events_genre_check
  check (genre in ('EDM', 'Festival', 'Indie', 'Rock', 'Hip-Hop', 'Pop', 'Jazz', 'Food', 'Culture'));

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
