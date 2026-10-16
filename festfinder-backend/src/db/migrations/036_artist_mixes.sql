-- Mixes on an artist's page: their sets and tracks on SoundCloud, Mixcloud and Spotify, played by
-- each service's own player (FeestFinder never hosts audio). People like them and talk about
-- them right there. The player's address is rebuilt by FeestFinder from the service's answer
-- (lib/mixes.ts) and only ever points at the service's own player host.
--
-- Likes and comments never rank an artist, a directory or a gig applicant, like follower counts.
-- Commenting is publishing: it needs a confirmed phone, three reports hide a comment until a
-- moderator looks, and the moderator's decision is audited.
create table artist_mixes (
  id             uuid primary key default gen_random_uuid(),
  artist_id      uuid not null references artists on delete cascade,
  provider       text not null check (provider in ('soundcloud', 'mixcloud', 'spotify')),
  kind           text not null check (kind in ('track', 'playlist', 'show', 'album', 'artist', 'episode')),
  url            text not null,             -- the set's page on the service
  embed_src      text not null,             -- the player's address, rebuilt by lib/mixes.ts
  title          text not null,
  author_name    text,
  thumbnail_url  text,
  duration_s     int check (duration_s > 0),
  event_id       uuid references events on delete set null,   -- recorded at this night
  pinned         boolean not null default false,
  sort           int not null default 0,
  like_count     int not null default 0 check (like_count >= 0),
  comment_count  int not null default 0 check (comment_count >= 0),
  created_by     uuid not null references users on delete cascade,
  created_at     timestamptz not null default now(),
  removed_at     timestamptz,
  removed_by     uuid references users on delete set null,
  removed_reason text
);
create unique index artist_mixes_one_url on artist_mixes (artist_id, url) where removed_at is null;
-- One pinned mix per artist: the one the page opens on.
create unique index artist_mixes_one_pinned on artist_mixes (artist_id) where pinned and removed_at is null;
create index artist_mixes_artist on artist_mixes (artist_id, sort) where removed_at is null;
create index artist_mixes_event on artist_mixes (event_id) where event_id is not null and removed_at is null;

create table artist_mix_likes (
  mix_id     uuid not null references artist_mixes on delete cascade,
  user_id    uuid not null references users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (mix_id, user_id)
);

create table artist_mix_comments (
  id           uuid primary key default gen_random_uuid(),
  mix_id       uuid not null references artist_mixes on delete cascade,
  user_id      uuid not null references users on delete cascade,
  parent_id    uuid references artist_mix_comments on delete cascade,
  body         text not null,
  at_s         int check (at_s >= 0),         -- "at 45:30" in the set
  status       text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  report_count int not null default 0 check (report_count >= 0),
  created_at   timestamptz not null default now(),
  removed_by   uuid references users on delete set null
);
create index artist_mix_comments_mix on artist_mix_comments (mix_id, created_at desc) where parent_id is null;
create index artist_mix_comments_parent on artist_mix_comments (parent_id, created_at) where parent_id is not null;
create index artist_mix_comments_user on artist_mix_comments (user_id, created_at desc);

create table artist_mix_comment_reports (
  comment_id  uuid not null references artist_mix_comments on delete cascade,
  user_id     uuid not null references users on delete cascade,
  reason      text not null check (reason in ('spam', 'abuse', 'personal', 'other')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  resolution  text,
  primary key (comment_id, user_id)
);
create index artist_mix_comment_reports_open on artist_mix_comment_reports (created_at) where resolved_at is null;

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
