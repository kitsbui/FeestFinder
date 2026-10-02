-- Event pages that the community and organisers run.
--
-- 1. Writing anything other people read needs a Vietnamese phone number proven by a
--    one-time code (Decree 147/2024). Reading, hyping and saving do not.
-- 2. Anyone with a proven number can submit an event. It belongs to the FeestFinder
--    community organiser and goes live only once a moderator approves it.
-- 3. Each event page carries a discussion, hype goals the organiser sets, and share links
--    that credit whoever shared them.
-- 4. Tickets move between attendees, as a gift or resold at no more than face value, up to
--    the moment the event ends. Every move gives the ticket a new QR version, so the old QR
--    stops working at the door.

-- ---- who may write ----------------------------------------------------------------

alter table users add column phone_verified_at timestamptz;
-- Zalo and WhatsApp sign-ups proved their number to sign up; connected numbers proved it too.
update users set phone_verified_at = created_at where phone is not null and signup_method in ('zalo', 'wa');
update users u set phone_verified_at = c.connected_at
  from social_connections c
 where c.user_id = u.id and c.provider in ('zalo', 'wa') and c.external_id = u.phone and u.phone_verified_at is null;

-- The short code in share links, made the first time someone shares.
alter table users add column ref_code text unique;

-- ---- community submissions -----------------------------------------------------------

alter table organizers add column is_community boolean not null default false;
alter table events add column submitted_by uuid references users on delete set null;
alter table events add column resale_enabled boolean not null default true;
create index events_submitted_by on events (submitted_by) where submitted_by is not null;

-- ---- discussion ----------------------------------------------------------------------

create table event_posts (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events on delete cascade,
  user_id       uuid not null references users on delete cascade,
  parent_id     uuid references event_posts on delete cascade,  -- replies go one level deep
  kind          text not null check (kind in ('qa', 'talk', 'crew', 'trackid', 'memory')),
  body          text not null check (char_length(body) between 1 and 1000),
  set_id        uuid references sets on delete set null,            -- track IDs: which set
  heard_at      text check (heard_at ~ '^([01]\d|2[0-3]):[0-5]\d$'),  -- track IDs: about when
  photo_url     text,
  status        text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  pinned        boolean not null default false,
  official      boolean not null default false,  -- the organiser's answer: also the page's FAQ
  helpful_count int not null default 0,
  reply_count   int not null default 0,
  report_count  int not null default 0,
  created_at    timestamptz not null default now(),
  edited_at     timestamptz,
  moderated_by  uuid references users on delete set null,
  moderated_at  timestamptz
);
create index event_posts_threads on event_posts (event_id, kind, created_at desc) where parent_id is null;
create index event_posts_replies on event_posts (parent_id, created_at) where parent_id is not null;
create index event_posts_user on event_posts (user_id, created_at desc);
create index event_posts_reported on event_posts (report_count desc) where report_count > 0;

create table event_post_votes (
  post_id    uuid not null references event_posts on delete cascade,
  user_id    uuid not null references users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table event_post_reports (
  post_id     uuid not null references event_posts on delete cascade,
  user_id     uuid not null references users on delete cascade,
  code        text not null check (code in ('spam', 'scalping', 'abuse', 'drugs', 'personal', 'other')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  primary key (post_id, user_id)
);

-- ---- hype goals and shares -----------------------------------------------------------

create table hype_goals (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events on delete cascade,
  threshold  int not null check (threshold between 1 and 10000000),
  reward     jsonb not null,
  reached_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, threshold)
);

create table event_shares (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events on delete cascade,
  user_id    uuid references users on delete set null,
  channel    text not null check (channel in ('zalo', 'facebook', 'messenger', 'threads', 'x', 'telegram', 'copy', 'native', 'story')),
  created_at timestamptz not null default now()
);
create index event_shares_event on event_shares (event_id, created_at);

-- One row per visitor a share link brought in, so a reload counts once.
create table share_visits (
  event_id   uuid not null references events on delete cascade,
  ref_user   uuid not null references users on delete cascade,
  visitor    text not null,
  channel    text not null,
  created_at timestamptz not null default now(),
  primary key (event_id, ref_user, visitor)
);
create index share_visits_ref on share_visits (ref_user, event_id);

-- ---- tickets that change hands ---------------------------------------------------------

-- The QR of version 0 is "<code>.<sig>"; later versions are "<code>~<v>.<sig>".
alter table tickets add column qr_version int not null default 0;

-- Every change to a ticket takes the next number, so a door scanner can ask for what
-- changed since its last download without trusting anyone's clock.
create sequence ticket_changes;
alter table tickets add column change_seq bigint not null default nextval('ticket_changes');
create index tickets_changes on tickets (event_id, change_seq);
create function tickets_touch() returns trigger language plpgsql as $$
begin
  new.change_seq := nextval('ticket_changes');
  return new;
end $$;
create trigger tickets_touch before update on tickets for each row execute function tickets_touch();

create table ticket_listings (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references tickets on delete cascade,
  event_id   uuid not null references events on delete cascade,
  seller_id  uuid not null references users on delete cascade,
  price      bigint not null check (price >= 10000),
  face_value bigint not null,
  status     text not null default 'active' check (status in ('active', 'reserved', 'sold', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  closed_at  timestamptz,
  check (price <= face_value)
);
create unique index ticket_listings_open on ticket_listings (ticket_id) where status in ('active', 'reserved');
create index ticket_listings_event on ticket_listings (event_id, status, price);

create table resale_orders (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,  -- FR + 6, matched in the bank transfer note
  listing_id     uuid not null references ticket_listings,
  ticket_id      uuid not null references tickets,
  event_id       uuid not null references events,
  buyer_id       uuid not null references users,
  seller_id      uuid not null references users,
  price          bigint not null,
  fee            bigint not null,
  total          bigint not null,
  -- failed: the money arrived but the ticket could no longer change hands, so it goes back.
  status         text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'expired', 'failed', 'refunded')),
  payment_method text not null check (payment_method in ('card', 'momo', 'zalopay', 'vietqr', 'mock')),
  provider_ref   text,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null,
  paid_at        timestamptz,
  -- The seller is paid once the event has happened, so a cancelled event can still refund the buyer.
  payout_due_at  timestamptz,
  paid_out_at    timestamptz,
  payout_ref     text
);
create index resale_orders_buyer on resale_orders (buyer_id, created_at desc);
create index resale_orders_open on resale_orders (status, expires_at) where status = 'pending';

create table ticket_transfers (
  id              uuid primary key default gen_random_uuid(),
  ticket_id       uuid not null references tickets on delete cascade,
  event_id        uuid not null references events on delete cascade,
  from_user       uuid references users on delete set null,
  to_user         uuid references users on delete set null,
  kind            text not null check (kind in ('gift', 'resale')),
  resale_order_id uuid references resale_orders,
  from_version    int not null,
  to_version      int not null,
  created_at      timestamptz not null default now()
);
create index ticket_transfers_ticket on ticket_transfers (ticket_id, created_at);
create index ticket_transfers_event on ticket_transfers (event_id, created_at desc);

-- People waiting for a resale ticket to appear (usually a sold-out night).
create table resale_watchers (
  user_id     uuid not null references users on delete cascade,
  event_id    uuid not null references events on delete cascade,
  created_at  timestamptz not null default now(),
  notified_at timestamptz,
  primary key (user_id, event_id)
);

-- ---- search engines ----------------------------------------------------------------------

-- Event URLs to tell IndexNow about (Bing, and the assistants that read its index).
create table indexnow_queue (
  url        text primary key,
  queued_at  timestamptz not null default now()
);

-- On Supabase, the new tables get the same treatment as the rest (see 007).
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
    revoke all on all functions in schema public from anon, authenticated;
  end if;
end $$;
