-- Organisers taking over community events, and a log of AI calls so each person's use of the
-- form fill-in can be capped.

-- An organiser asking to run an event the community sent in. A moderator decides.
create table event_claims (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events on delete cascade,
  organizer_id  uuid not null references organizers on delete cascade,
  user_id       uuid references users on delete set null,
  note          text not null default '',
  proof_url     text,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz not null default now(),
  decided_at    timestamptz,
  decided_by    uuid references users on delete set null,
  decision_note text
);
create unique index event_claims_open on event_claims (event_id, organizer_id) where status = 'pending';
create index event_claims_status on event_claims (status, created_at);

-- One row per call to an AI model on someone's behalf, to cap it per person and hour.
create table ai_calls (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users on delete cascade,
  purpose    text not null,
  created_at timestamptz not null default now()
);
create index ai_calls_user on ai_calls (user_id, created_at desc);

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
