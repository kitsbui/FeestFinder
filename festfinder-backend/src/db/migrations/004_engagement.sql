-- What attendees do: save, hype, follow, plan, go together, report, rate.

create table saves (
  user_id    uuid not null references users on delete cascade,
  event_id   uuid not null references events on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);
create index saves_event on saves (event_id);

create table hypes (
  user_id    uuid not null references users on delete cascade,
  event_id   uuid not null references events on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table going (
  user_id    uuid not null references users on delete cascade,
  event_id   uuid not null references events on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);
create index going_event on going (event_id);

create table organizer_follows (
  user_id      uuid not null references users on delete cascade,
  organizer_id uuid not null references organizers on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, organizer_id)
);

create table artist_follows (
  user_id    uuid not null references users on delete cascade,
  artist     text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, artist)
);

-- Clash-finder picks. `remind` drives the "15 min before" reminder.
create table plan_picks (
  user_id    uuid not null references users on delete cascade,
  set_id     uuid not null references sets on delete cascade,
  remind     boolean not null default false,
  reminded_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, set_id)
);

create table notification_prefs (
  user_id uuid not null references users on delete cascade,
  topic   text not null check (topic in ('saved', 'tickets', 'artists', 'orgs', 'friends', 'weekly', 'sets')),
  push    boolean not null default false,
  zalo    boolean not null default false,
  email   boolean not null default false,
  primary key (user_id, topic)
);

create table smart_alerts (
  user_id       uuid primary key references users on delete cascade,
  enabled       boolean not null default true,
  genres        text[] not null default '{}',
  artists       text[] not null default '{}',
  organizer_ids uuid[] not null default '{}',
  areas         text[] not null default '{}',
  price_cap     bigint,            -- null = any price, 0 = free only
  updated_at    timestamptz not null default now()
);

create table tier_watchers (
  user_id     uuid not null references users on delete cascade,
  tier_id     uuid not null references ticket_tiers on delete cascade,
  created_at  timestamptz not null default now(),
  notified_at timestamptz,
  primary key (user_id, tier_id)
);

create table listing_reports (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events on delete cascade,
  user_id     uuid not null references users on delete cascade,
  code        text not null check (code in ('wrong', 'cancelled', 'scam', 'duplicate', 'offensive', 'price', 'refund', 'safety')),
  note        text not null default '',
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  resolution  text check (resolution in ('taken_down', 'warned', 'dismissed')),
  unique (event_id, user_id)
);

create table recaps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users on delete cascade,
  event_id   uuid not null references events on delete cascade,
  stars      int not null check (stars between 1 and 5),
  aspects    text[] not null default '{}',
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

-- Live mode: who is on site and roughly where. Only ever shown to friends.
create table presence (
  user_id    uuid not null references users on delete cascade,
  event_id   uuid not null references events on delete cascade,
  zone_id    uuid references site_zones on delete set null,
  updated_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table direct_messages (
  id           uuid primary key default gen_random_uuid(),
  seq          bigserial,              -- tie-breaker for messages in the same millisecond
  sender_id    uuid not null references users on delete cascade,
  recipient_id uuid not null references users on delete cascade,
  kind         text not null default 'text' check (kind in ('text', 'invite', 'wave')),
  body         text not null default '',
  event_id     uuid references events on delete set null,
  created_at   timestamptz not null default now(),
  read_at      timestamptz
);
create index direct_messages_pair on direct_messages (least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at);

create table group_plans (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events on delete cascade,
  owner_id   uuid not null references users on delete cascade,
  meet_spot  text check (meet_spot in ('gate', 'cafe', 'park')),
  created_at timestamptz not null default now(),
  unique (event_id, owner_id)
);

create table group_plan_members (
  plan_id          uuid not null references group_plans on delete cascade,
  user_id          uuid not null references users on delete cascade,
  status           text not null default 'pending' check (status in ('pending', 'going', 'declined')),
  paid             boolean not null default false,
  paid_at          timestamptz,
  invited_at       timestamptz not null default now(),
  responded_at     timestamptz,
  last_reminded_at timestamptz,
  primary key (plan_id, user_id)
);
create index group_plan_members_user on group_plan_members (user_id);

create table group_plan_messages (
  id         uuid primary key default gen_random_uuid(),
  seq        bigserial,
  plan_id    uuid not null references group_plans on delete cascade,
  user_id    uuid references users on delete set null,
  kind       text not null default 'text' check (kind in ('text', 'payment_request', 'system')),
  body       text not null,
  payload    jsonb,
  created_at timestamptz not null default now()
);

create table payment_requests (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references group_plans on delete cascade,
  created_by      uuid not null references users,
  method          text not null check (method in ('vietqr', 'momo', 'zalopay')),
  amount_per_head bigint not null,
  reference       text not null unique,
  qr_payload      text not null,
  payee           jsonb not null,
  recipient_ids   uuid[] not null,
  created_at      timestamptz not null default now()
);

-- In-app notification centre, for attendees (user_id) or organisers (organizer_id).
create table notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users on delete cascade,
  organizer_id uuid references organizers on delete cascade,
  kind         text not null,
  title        jsonb not null,
  body         jsonb not null,
  cta          jsonb,
  link         jsonb,
  dedupe_key   text,
  read_at      timestamptz,
  created_at   timestamptz not null default now(),
  check (user_id is not null or organizer_id is not null)
);
create index notifications_user on notifications (user_id, created_at desc);
create index notifications_org on notifications (organizer_id, created_at desc);
create unique index notifications_dedupe on notifications (coalesce(user_id, organizer_id), dedupe_key) where dedupe_key is not null;

create table devices (
  token      text primary key,
  user_id    uuid not null references users on delete cascade,
  platform   text not null check (platform in ('ios', 'android', 'web')),
  updated_at timestamptz not null default now()
);

-- Every outbound push / Zalo / email / SMS goes through here and a worker delivers it.
create table outbox (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users on delete cascade,
  channel         text not null check (channel in ('push', 'zalo', 'email', 'sms', 'whatsapp')),
  address         text,
  template        text not null,
  payload         jsonb not null,
  status          text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  attempts        int not null default 0,
  not_before      timestamptz not null default now(),
  sent_at         timestamptz,
  error           text,
  announcement_id uuid,
  created_at      timestamptz not null default now()
);
create index outbox_due on outbox (not_before) where status = 'pending';

create table uploads (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references users on delete cascade,
  purpose    text not null check (purpose in ('cover', 'logo', 'avatar', 'recap')),
  mime       text not null,
  bytes      int not null,
  width      int,
  height     int,
  sha256     text not null,
  url        text not null,
  created_at timestamptz not null default now()
);

create table event_metrics_daily (
  event_id      uuid not null references events on delete cascade,
  day           date not null,
  views         int not null default 0,
  ticket_clicks int not null default 0,
  sources       jsonb not null default '{}',
  primary key (event_id, day)
);

create table ai_guides (
  event_id   uuid not null references events on delete cascade,
  lang       text not null check (lang in ('en', 'vi')),
  data       jsonb not null,
  model      text not null,
  created_at timestamptz not null default now(),
  primary key (event_id, lang)
);
