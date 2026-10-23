-- The news feed (owner, 2026-10-22): the latest headlines of reputable EDM publications, read
-- from the RSS and Atom feeds they publish for syndication (services/news.ts; the fetchNews job
-- reads each source on its own interval) and shown on the blog's news page with the picture each
-- feed carries, every item linking to the publisher. Never an article's text: the feed's own
-- summary, clipped, and, when Claude is configured, a two-sentence digest in Vietnamese and
-- English, marked as machine-written. The team switches a source on or off and hides an item
-- from the Console (/console/news). Items older than six months are purged: they are headlines
-- that point elsewhere, not FeestFinder's own words.

create table news_sources (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (length(name) between 2 and 80),
  site_url          text not null,
  feed_url          text not null unique,
  lang              text not null default 'en' check (lang in ('en', 'vi', 'th', 'ja', 'id')),
  -- Where the publication writes from: what it says about Asia or Vietnam leads the feed.
  region            text not null default 'global' check (region in ('global', 'asia', 'vietnam')),
  enabled           boolean not null default true,
  interval_minutes  int not null default 60 check (interval_minutes between 15 and 1440),
  etag              text,
  last_modified     text,
  next_run_at       timestamptz not null default now(),
  last_run_at       timestamptz,
  last_error        text,
  last_count        int,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index news_sources_due on news_sources (next_run_at) where enabled;

create table news_items (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid not null references news_sources on delete cascade,
  -- The feed's own id for the item, else its link.
  guid          text not null,
  url           text not null,
  title         text not null,
  -- The feed's summary, plain text, at most 300 characters.
  summary       text,
  -- {"en": "…", "vi": "…"}, machine-written from the title and summary; null until written.
  digest        jsonb,
  image_url     text,
  -- feed: the feed carried a picture; page: read from the article's own preview; none: looked, found nothing; null: not looked yet.
  image_from    text check (image_from in ('feed', 'page', 'none')),
  author        text,
  topic         text not null default 'scene' check (topic in ('festival', 'artist', 'industry', 'tech', 'scene')),
  region        text not null default 'global' check (region in ('global', 'asia', 'vietnam')),
  styles        text[] not null default '{}',
  published_at  timestamptz not null,
  fetched_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  hidden_at     timestamptz,
  unique (source_id, guid)
);
create index news_items_public on news_items (published_at desc) where hidden_at is null;
create index news_items_undigested on news_items (fetched_at) where digest is null and hidden_at is null;
create index news_items_unpictured on news_items (fetched_at) where image_from is null and hidden_at is null;

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
