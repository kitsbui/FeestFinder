-- Event intelligence: places with their own timezone and currency, where each event's facts
-- came from, the raw records sources sent, and the sources FeestFinder reads on a schedule.
--
-- 1. Countries and cities become tables. The built-in list in src/lib/places.ts is written
--    to them after every migration, so the rows below are only the ones existing events need.
-- 2. `events` stays the one canonical record. A source never creates a second copy of an
--    event: it attaches to the event (event_sources) or waits in the review queue as a new one.
-- 3. Every record a source sends is kept as it came (raw_events), so it can be normalised
--    again when the rules change, and every event can say where it came from.

-- ---- places ---------------------------------------------------------------------------

create table countries (
  code      text primary key check (code ~ '^[A-Z]{2}$'),
  name      jsonb not null,
  currency  text not null check (currency ~ '^[A-Z]{3}$'),
  timezone  text not null,
  sort      int not null default 0
);

create table cities (
  slug          text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  country_code  text not null references countries,
  name          jsonb not null,
  timezone      text not null,
  currency      text not null check (currency ~ '^[A-Z]{3}$'),
  lat           double precision not null,
  lng           double precision not null,
  bbox          double precision[] not null check (array_length(bbox, 1) = 4),  -- minLng, minLat, maxLng, maxLat
  aliases       text[] not null default '{}',
  launched      boolean not null default false,
  sort          int not null default 0
);
create index cities_country on cities (country_code);

insert into countries (code, name, currency, timezone, sort) values
  ('VN', '{"en":"Vietnam","vi":"Việt Nam"}', 'VND', 'Asia/Ho_Chi_Minh', 10);
insert into cities (slug, country_code, name, timezone, currency, lat, lng, bbox, launched, sort) values
  ('ho-chi-minh', 'VN', '{"en":"Ho Chi Minh City","vi":"TP.HCM"}', 'Asia/Ho_Chi_Minh', 'VND', 10.7769, 106.7009, '{106.33,10.3,107.6,11.52}', true, 10),
  ('ha-noi', 'VN', '{"en":"Hanoi","vi":"Hà Nội"}', 'Asia/Ho_Chi_Minh', 'VND', 21.0285, 105.8542, '{105.28,20.56,106.02,21.39}', true, 20),
  ('da-nang', 'VN', '{"en":"Da Nang","vi":"Đà Nẵng"}', 'Asia/Ho_Chi_Minh', 'VND', 16.0544, 108.2022, '{107.2,14.9,108.75,16.35}', true, 30),
  ('nha-trang', 'VN', '{"en":"Nha Trang","vi":"Nha Trang"}', 'Asia/Ho_Chi_Minh', 'VND', 12.2388, 109.1967, '{108.55,11.25,109.48,12.88}', true, 40);

update events set city = 'ho-chi-minh' where city is null or city not in (select slug from cities);
alter table events add constraint events_city_fk foreign key (city) references cities;
update venues set city = 'ho-chi-minh' where city is null or city not in (select slug from cities);
alter table venues add constraint venues_city_fk foreign key (city) references cities;

-- ---- venues that can be matched ------------------------------------------------------------

alter table venues add column aliases text[] not null default '{}';
alter table venues add column website text;
alter table venues add column instagram text;
alter table venues add column facebook text;
alter table venues add column venue_type text check (venue_type in ('club', 'bar', 'concert_hall', 'arena', 'outdoor', 'gallery', 'other'));
create index venues_city on venues (city);

-- ---- what an event is, and how sure we are of it ------------------------------------------

-- Prices are whole units of the event's currency (a đồng, a yen, a baht).
alter table events add column currency text not null default 'VND' check (currency ~ '^[A-Z]{3}$');
alter table events add column event_type text check (event_type in ('club', 'festival', 'concert', 'rave', 'party', 'show', 'other'));
-- Music styles from the taxonomy in src/lib/styles.ts; `genre` stays the broad category and colour.
alter table events add column styles text[] not null default '{}';
alter table events add column confidence_score int check (confidence_score between 0 and 100);
alter table events add column confidence text check (confidence in ('low', 'likely', 'verified', 'highly_verified'));
alter table events add column confidence_breakdown jsonb not null default '[]';
alter table events add column source_count int not null default 0;
alter table events add column first_seen_at timestamptz;
alter table events add column last_seen_at timestamptz;
alter table events add column last_verified_at timestamptz;
update events set first_seen_at = created_at, last_seen_at = coalesce(updated_at, created_at),
                  last_verified_at = coalesce(decided_at, published_at);
create index events_styles on events using gin (styles);
create index events_geo on events (lat, lng) where status = 'live' and lat is not null;
create index events_city_live on events (city, starts_on) where status = 'live';

-- ---- the sources FeestFinder reads ----------------------------------------------------------

create table ingest_sources (
  id                uuid primary key default gen_random_uuid(),
  adapter           text not null,                     -- website | ics | ticketmaster (src/services/ingest/adapters)
  name              text not null,
  url               text,
  city              text references cities,
  -- How much a fact from this source is worth on its own: the event's own site, a ticket seller, a listing.
  authority         text not null default 'listing' check (authority in ('official', 'ticketing', 'listing')),
  config            jsonb not null default '{}',
  interval_minutes  int not null default 720 check (interval_minutes >= 30),
  enabled           boolean not null default true,
  etag              text,
  last_modified     text,
  content_hash      text,
  next_run_at       timestamptz not null default now(),
  last_run_at       timestamptz,
  last_error        text,
  created_by        uuid references users on delete set null,
  created_at        timestamptz not null default now()
);
create index ingest_sources_due on ingest_sources (next_run_at) where enabled;

create table ingest_runs (
  id           uuid primary key default gen_random_uuid(),
  source_id    uuid not null references ingest_sources on delete cascade,
  started_at   timestamptz not null,
  finished_at  timestamptz,
  fetched      int not null default 0,
  parsed       int not null default 0,
  rejected     int not null default 0,
  created      int not null default 0,
  merged       int not null default 0,
  unchanged    int not null default 0,
  failed       int not null default 0,
  errors       jsonb not null default '[]',
  trigger      text not null default 'schedule' check (trigger in ('schedule', 'manual'))
);
create index ingest_runs_source on ingest_runs (source_id, started_at desc);

-- Every record a source sent, as it came.
create table raw_events (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid not null references ingest_sources on delete cascade,
  provider      text not null,
  external_id   text not null,
  source_url    text,
  payload       jsonb not null,
  content_hash  text not null,
  fetched_at    timestamptz not null,
  last_seen_at  timestamptz not null,
  status        text not null default 'pending' check (status in ('pending', 'created', 'merged', 'rejected', 'failed')),
  error         text,
  event_id      uuid references events on delete set null,
  match_score   int,
  match_reason  text,
  processed_at  timestamptz,
  unique (source_id, external_id)
);
create index raw_events_event on raw_events (event_id) where event_id is not null;
create index raw_events_status on raw_events (status, fetched_at desc);

-- Where each event's facts came from. An event has one row per source that lists it.
create table event_sources (
  id                   uuid primary key default gen_random_uuid(),
  event_id             uuid not null references events on delete cascade,
  provider             text not null,      -- organizer | community | team | website | ics | ticketmaster | resident_advisor | facebook | …
  authority            text not null check (authority in ('official', 'ticketing', 'listing', 'community')),
  external_id          text,
  source_url           text,
  source_host          text,
  ingest_source_id     uuid references ingest_sources on delete set null,
  raw_event_id         uuid references raw_events on delete set null,
  provider_confidence  int not null default 50 check (provider_confidence between 0 and 100),
  match_score          int,
  match_reason         text,
  -- Facts this source states differently from the event, e.g. [{"field":"starts_on","source":"2026-10-11","event":"2026-10-10"}].
  conflicts            jsonb not null default '[]',
  cancelled            boolean not null default false,
  first_seen_at        timestamptz not null default now(),
  last_seen_at         timestamptz not null default now(),
  published_at         timestamptz,
  added_by             uuid references users on delete set null
);
create index event_sources_event on event_sources (event_id);
create unique index event_sources_external on event_sources (provider, external_id) where external_id is not null;
create unique index event_sources_url on event_sources (event_id, source_url) where source_url is not null and external_id is null;
create unique index event_sources_origin on event_sources (event_id, provider) where provider in ('organizer', 'community', 'team');

-- Every event so far came from inside FeestFinder: an organiser, the community or the team.
insert into event_sources (event_id, provider, authority, source_url, source_host, provider_confidence, first_seen_at, last_seen_at, published_at, added_by)
select e.id,
       case when e.submitted_by is not null then 'community' when o.is_community then 'team' else 'organizer' end,
       case when e.submitted_by is not null then 'community' when o.verification_state = 'verified' then 'official' else 'listing' end,
       nullif(e.event_url, ''),
       nullif(substring(e.event_url from '^https?://(?:www\.)?([^/:?#]+)'), ''),
       case when e.submitted_by is not null then 40 when o.verification_state = 'verified' then 90 else 60 end,
       e.created_at, coalesce(e.updated_at, e.created_at), e.published_at, e.submitted_by
  from events e join organizers o on o.id = e.organizer_id;
update events e set source_count = (select count(*) from event_sources s where s.event_id = e.id);

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
