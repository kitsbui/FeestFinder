-- A project names its own page (a website or a social page, `link_url`) and the artists it wants
-- on its lineup (owner, 2026-10-20). A lineup name is always an artist record: a profile someone
-- runs, or one made for the name that waits for its artist to claim it ("Đây là tôi"), as event
-- lineups do (services/artists.ts ensureArtists). The order is the owner's.

alter table projects add column link_url text check (link_url is null or (link_url ~ '^https://' and length(link_url) <= 500));

create table project_artists (
  project_id  uuid not null references projects on delete cascade,
  artist_id   uuid not null references artists on delete cascade,
  sort        int not null default 0,
  primary key (project_id, artist_id)
);
create index project_artists_artist on project_artists (artist_id);

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
