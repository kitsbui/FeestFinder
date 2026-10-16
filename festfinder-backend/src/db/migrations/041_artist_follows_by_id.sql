-- Artists as a social network: follows of a profile, and the lineup handshake.
--
-- 1. artist_follows followed a name (004, 017), so two artists with one name shared their
--    followers, a renamed artist lost theirs, and anyone could follow a name nobody runs. A
--    follow now points at the artist's record: artist_id. The name column stays (the lineup
--    notices still read it), and the boot links every existing follow whose name or alias
--    matches a record (services/artists.ts backfillArtistFollows, idempotent). A follow that
--    matches nothing keeps a null artist_id and is left as it was.
-- 2. An organiser who lists an artist who runs their profile, or an artist who says they play a
--    listed night, asks the other side to confirm: event_artists records who confirmed and
--    whether the artist said "not me". A name an artist disputed is not linked to them again
--    for that event (lineup_disputes).

alter table artist_follows add column artist_id uuid references artists on delete cascade;
create index artist_follows_artist on artist_follows (artist_id, user_id) where artist_id is not null;

alter table event_artists add column confirmed_at timestamptz;
alter table event_artists add column confirmed_by text check (confirmed_by in ('artist', 'organizer', 'both'));
alter table event_artists add column disputed_at timestamptz;
alter table event_artists add column disputed_note text;

create table lineup_disputes (
  event_id         uuid not null references events on delete cascade,
  normalized_name  text not null,
  artist_id        uuid references artists on delete set null,
  note             text,
  created_at       timestamptz not null default now(),
  primary key (event_id, normalized_name)
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
