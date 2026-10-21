-- An artist's MP3 playlist (owner, 2026-10-20): up to ten tracks on their page, each an https link
-- to an MP3 the artist hosts, played by the page's own waveform player. The API reads a file once
-- when it is added and keeps its waveform (`peaks`, 600 values of 0–100) and length, so the page
-- draws it without downloading the file; the file streams only when someone presses play.
-- FeestFinder never stores the audio.

create table artist_tracks (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references artists on delete cascade,
  sort        int not null default 0,
  url         text not null check (url ~ '^https://' and length(url) <= 1000),
  title       text not null check (length(title) between 1 and 200),
  duration_s  int check (duration_s >= 0),
  peaks       jsonb not null,
  bytes       int,
  created_at  timestamptz not null default now(),
  unique (artist_id, url)
);
create index artist_tracks_artist on artist_tracks (artist_id, sort);

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
