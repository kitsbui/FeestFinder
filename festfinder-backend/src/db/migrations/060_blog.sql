-- The blog (owner, 2026-10-20): posts about music styles, music news, shared playlists, DJ skills,
-- and round-ups and reviews of clubs and cafés, in Vietnamese and English. Anyone signed in writes;
-- the team reviews a post before it is public, as it does listings and projects, and a post the
-- team writes is public at once. Words are `{en, vi}` pairs (a writer may fill one language, the
-- page reads the other's); `lang` is the language a post was first written in.
--
-- Guides (a genre's page) carry quick facts, questions and their answers, and the sources they
-- rest on, and may sit under a parent guide (a sub-genre under its genre). The team's editorial
-- posts come from content packs in the repository (festfinder-backend/content/blog), imported by a
-- job: `import_key` names a post's place in a pack and `import_hash` what was last imported, so a
-- pack's newer words replace the old ones until someone edits the post (`edited_at`), and never
-- after. Such a post has no author account (`byline` names who wrote it).
--
-- A post's tracks are players from SoundCloud, Mixcloud, Spotify and YouTube: the player's
-- address is rebuilt by FeestFinder from a link or a pasted embed code (lib/mixes.ts), and no
-- service's HTML is ever kept.

create table blog_posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9-]{3,90}$'),
  author_user_id  uuid references users on delete set null,
  byline          text,
  category        text not null check (category in ('styles', 'news', 'playlist', 'dj', 'venues')),
  lang            text not null default 'vi' check (lang in ('vi', 'en')),
  title           jsonb not null default '{"en":"","vi":""}',
  excerpt         jsonb not null default '{"en":"","vi":""}',
  body            jsonb not null default '{"en":"","vi":""}',
  cover_url       text,
  cover_credit    text,
  styles          text[] not null default '{}',
  city            text references cities,
  facts           jsonb not null default '[]',
  faq             jsonb not null default '[]',
  sources         jsonb not null default '[]',
  parent_id       uuid references blog_posts on delete set null,
  import_key      text unique,
  import_hash     text,
  edited_at       timestamptz,
  status          text not null default 'draft' check (status in ('draft', 'in_review', 'published', 'rejected', 'hidden')),
  decision_note   text,
  decided_by      uuid references users on delete set null,
  decided_at      timestamptz,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (author_user_id is not null or byline is not null or import_key is not null)
);
create index blog_posts_public on blog_posts (published_at desc) where status = 'published';
create index blog_posts_review on blog_posts (updated_at) where status = 'in_review';
create index blog_posts_author on blog_posts (author_user_id, updated_at desc);
create index blog_posts_parent on blog_posts (parent_id) where parent_id is not null;

create table blog_tracks (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid not null references blog_posts on delete cascade,
  sort           int not null default 0,
  provider       text not null check (provider in ('soundcloud', 'mixcloud', 'spotify', 'youtube')),
  kind           text not null,
  url            text,
  embed_src      text not null,
  title          text not null,
  author_name    text,
  thumbnail_url  text,
  year           int check (year between 1950 and 2100),
  note           jsonb not null default '{"en":"","vi":""}',
  created_at     timestamptz not null default now()
);
create index blog_tracks_post on blog_tracks (post_id, sort);

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
