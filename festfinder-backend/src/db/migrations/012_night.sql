-- What the organiser tells everyone on the night: a set running late, a quiet gate, water points.
create table event_updates (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events on delete cascade,
  author_id  uuid references users on delete set null,
  kind       text not null default 'info' check (kind in ('info', 'delay', 'gate', 'safety', 'lineup')),
  body       text not null check (char_length(body) between 1 and 500),
  notified   boolean not null default false,
  created_at timestamptz not null default now(),
  removed_at timestamptz
);
create index event_updates_event on event_updates (event_id, created_at desc);

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
