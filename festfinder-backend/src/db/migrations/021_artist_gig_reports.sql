-- Gigs an artist says they are playing. A report is one more source next to organisers, the
-- community and imports: it is matched against the catalogue like an import and either joins
-- an existing event as a source or waits in the review queue as a new candidate. It never
-- publishes anything, and it never adds the artist to someone else's lineup by itself.

create table artist_gig_reports (
  id            uuid primary key default gen_random_uuid(),
  artist_id     uuid not null references artists on delete cascade,
  user_id       uuid references users on delete set null,
  -- What they sent, as sent: title, starts, city, venue, links, other names on the bill.
  payload       jsonb not null,
  -- created: a new candidate in the review queue. merged: an event already listed. rejected: why in `error`.
  outcome       text not null check (outcome in ('created', 'merged', 'rejected')),
  event_id      uuid references events on delete set null,
  match_score   int,
  match_reason  text,
  error         text,
  created_at    timestamptz not null default now()
);
create index artist_gig_reports_artist on artist_gig_reports (artist_id, created_at desc);
create index artist_gig_reports_event on artist_gig_reports (event_id) where event_id is not null;

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
