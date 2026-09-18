-- Organiser messaging, moderation, audit, advertising and sessions.

create table announcements (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events on delete cascade,
  audience     text not null check (audience in ('saved', 'holders', 'vip', 'past')),
  channels     text[] not null,
  subject      text not null,
  body         text not null check (char_length(body) <= 320),
  status       text not null check (status in ('scheduled', 'sent', 'cancelled')),
  send_at      timestamptz not null,
  sent_at      timestamptz,
  reach        int not null default 0,
  opened       int not null default 0,
  created_by   uuid references users,
  created_at   timestamptz not null default now()
);
create index announcements_event on announcements (event_id, send_at desc);

create table inbox_threads (
  id               uuid primary key default gen_random_uuid(),
  organizer_id     uuid not null references organizers on delete cascade,
  event_id         uuid references events on delete set null,
  topic            text not null check (topic in ('moderation', 'partnerships', 'support')),
  subject          jsonb not null,
  organizer_unread boolean not null default true,
  admin_unread     boolean not null default false,
  updated_at       timestamptz not null default now(),
  created_at       timestamptz not null default now()
);
create index inbox_threads_org on inbox_threads (organizer_id, updated_at desc);

create table inbox_messages (
  id         uuid primary key default gen_random_uuid(),
  seq        bigserial,
  thread_id  uuid not null references inbox_threads on delete cascade,
  sender     text not null check (sender in ('ff', 'org')),
  author_id  uuid references users on delete set null,
  body       jsonb not null,
  created_at timestamptz not null default now()
);

create table organizer_notification_prefs (
  organizer_id uuid not null references organizers on delete cascade,
  topic        text not null check (topic in ('moderation', 'tickets', 'payouts', 'crew')),
  enabled      boolean not null,
  primary key (organizer_id, topic)
);

create table moderation_decisions (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events on delete cascade,
  decision     text not null check (decision in ('approved', 'rejected', 'taken_down', 'overturned', 'upheld')),
  reason_code  text check (reason_code in ('venue', 'ticket', 'image', 'permit', 'duplicate', 'policy')),
  message      text,
  allow_appeal boolean not null default false,
  decided_by   uuid references users,
  decided_at   timestamptz not null default now()
);
create index moderation_decisions_day on moderation_decisions (decided_at);

create table appeals (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events on delete cascade,
  decision_id uuid not null references moderation_decisions,
  reason_code text not null,
  message     text not null,
  state       text not null default 'open' check (state in ('open', 'replied', 'overturned', 'upheld', 'expired')),
  reply       text,
  replied_at  timestamptz,
  closes_at   timestamptz not null,
  decided_by  uuid references users,
  decided_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- Append-only, hash-chained. Each row's hash covers the previous row's hash.
create table audit_log (
  seq          bigserial primary key,
  at           timestamptz not null default now(),
  actor_type   text not null check (actor_type in ('admin', 'system', 'organizer')),
  actor_id     uuid,
  actor_label  text not null,
  action       text not null,
  target_type  text not null,
  target_id    text,
  target_label text not null,
  diff         jsonb,
  prev_hash    text not null,
  hash         text not null unique
);

create function audit_log_append_only() returns trigger language plpgsql as $$
begin
  raise exception 'audit_log is append-only';
end $$;

create trigger audit_log_no_change before update or delete on audit_log
  for each row execute function audit_log_append_only();

create table ad_inquiries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users on delete set null,
  brand      text not null,
  category   text not null check (category in ('F&B', 'Fashion', 'Healthcare')),
  email      text not null,
  budget     text not null,
  placements text[] not null,
  message    text not null default '',
  status     text not null default 'new' check (status in ('new', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table ad_campaigns (
  id            uuid primary key default gen_random_uuid(),
  inquiry_id    uuid references ad_inquiries on delete set null,
  brand         text not null,
  category      text not null check (category in ('F&B', 'Fashion', 'Healthcare')),
  logo          text not null,
  art           text,
  headline      jsonb not null default '{"en":"","vi":""}',
  body          jsonb not null default '{"en":"","vi":""}',
  cta           jsonb not null default '{"en":"","vi":""}',
  url           text,
  placement     text not null check (placement in ('feed', 'banner', 'live')),
  active        boolean not null default true,
  genres        text[] not null default '{}',
  areas         text[] not null default '{}',
  is_alcohol    boolean not null default false,
  budget_total  bigint not null default 0,
  daily_cap     bigint not null default 12000000,
  impressions   bigint not null default 0,
  clicks        bigint not null default 0,
  spend         bigint not null default 0,
  created_at    timestamptz not null default now()
);

create table ad_hides (
  user_id     uuid not null references users on delete cascade,
  campaign_id uuid not null references ad_campaigns on delete cascade,
  primary key (user_id, campaign_id)
);

create table ad_settings (
  id    int primary key default 1 check (id = 1),
  rates jsonb not null default '{"feed":180000,"banner":240000,"live":520000}'
);
insert into ad_settings default values;

create table sessions (
  token_hash      text primary key,
  kind            text not null check (kind in ('user', 'staff')),
  user_id         uuid references users on delete cascade,
  staff_id        uuid references event_staff on delete cascade,
  read_only       boolean not null default false,
  impersonator_id uuid references users on delete cascade,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null,
  check ((kind = 'user' and user_id is not null) or (kind = 'staff' and staff_id is not null))
);
create index sessions_user on sessions (user_id);
