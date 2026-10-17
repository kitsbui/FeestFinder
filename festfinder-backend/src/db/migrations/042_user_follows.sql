-- People follow people (owner, 2026-10-17). Every account attends; an artist's or an organiser's
-- profile is run by accounts too, so the follower and following counts on every profile are read
-- from real follows: of profiles (organizer_follows, artist_follows) and now of people.
-- organizers.followers_count was a counter the API moved by hand (and imports or demo data could
-- set to anything); it now equals its real follows, kept so by a trigger, which also counts the
-- follows a deleted account takes with it.
create table user_follows (
  follower_id uuid not null references users on delete cascade,
  user_id     uuid not null references users on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, user_id),
  check (follower_id <> user_id)
);
create index user_follows_user on user_follows (user_id, created_at desc);

create or replace function organizer_followers_sync() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update organizers set followers_count = followers_count + 1 where id = new.organizer_id;
  elsif tg_op = 'DELETE' then
    update organizers set followers_count = greatest(followers_count - 1, 0) where id = old.organizer_id;
  end if;
  return null;
end $$;

drop trigger if exists organizer_follows_count on organizer_follows;
create trigger organizer_follows_count after insert or delete on organizer_follows
  for each row execute function organizer_followers_sync();

update organizers o set followers_count = (select count(*) from organizer_follows f where f.organizer_id = o.id)
 where followers_count is distinct from (select count(*) from organizer_follows f where f.organizer_id = o.id);

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
