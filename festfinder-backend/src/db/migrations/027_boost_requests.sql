-- Boost requests: an organiser asks for a live listing to be featured ("Đẩy tin", offered in the
-- studio and on the wizard's success card). The team answers in the console, usually by adding
-- the event to a featured shelf. One open request per event.

create table boost_requests (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events on delete cascade,
  organizer_id  uuid not null references organizers on delete cascade,
  requested_by  uuid references users on delete set null,
  status        text not null default 'open' check (status in ('open', 'done', 'declined')),
  created_at    timestamptz not null default now(),
  answered_at   timestamptz,
  answered_by   uuid references users on delete set null
);

create unique index boost_requests_one_open on boost_requests (event_id) where status = 'open';
create index boost_requests_by_status on boost_requests (status, created_at desc);
