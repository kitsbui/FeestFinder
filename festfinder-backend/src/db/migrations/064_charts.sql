-- Charts (owner, 2026-10-22, from the playlist handoff): the top tracks of a style as a reputable
-- chart ranks them this week, read by the refreshCharts job (services/charts.ts) from the
-- providers' own APIs with the keys in the environment (Beatport's top 100 per genre with
-- BEATPORT_CLIENT_ID/SECRET; a Spotify playlist's tracks with SPOTIFY_CLIENT_ID/SECRET), never
-- from a page. A source names its style (lib/styles.ts) and the chart it reads; its entries are
-- replaced on every read and shown on the style's playlist posts and in the style hub
-- (GET /styles/:key), each linking to the provider. Without keys nothing is read.

create table chart_sources (
  id                uuid primary key default gen_random_uuid(),
  provider          text not null check (provider in ('beatport', 'spotify')),
  name              text not null check (length(name) between 2 and 80),
  style             text not null,
  -- Beatport: the genre's id; Spotify: the playlist's id.
  external_id       text not null,
  -- The chart's own page, where every entry's "see more" leads.
  url               text not null,
  enabled           boolean not null default true,
  interval_minutes  int not null default 1440 check (interval_minutes between 60 and 10080),
  next_run_at       timestamptz not null default now(),
  last_run_at       timestamptz,
  last_error        text,
  last_count        int,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (provider, external_id)
);
create index chart_sources_style on chart_sources (style) where enabled;

create table chart_entries (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid not null references chart_sources on delete cascade,
  rank          int not null check (rank between 1 and 200),
  artist        text not null,
  title         text not null,
  label         text,
  released_on   date,
  url           text,
  image_url     text,
  external_id   text,
  fetched_at    timestamptz not null default now(),
  unique (source_id, rank)
);

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
