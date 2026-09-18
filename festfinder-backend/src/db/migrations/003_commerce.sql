-- Checkout, tickets, door operations and payouts.

create table promo_codes (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events on delete cascade,
  code       text not null check (code ~ '^[A-Z0-9]{3,24}$'),
  pct        int not null check (pct between 1 and 100),
  cap        int not null check (cap > 0),
  used       int not null default 0,
  note       jsonb not null default '{"en":"","vi":""}',
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (event_id, code)
);

create table orders (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  user_id        uuid not null references users,
  event_id       uuid not null references events,
  tier_id        uuid not null references ticket_tiers,
  qty            int not null check (qty between 1 and 6),
  unit_price     bigint not null,
  subtotal       bigint not null,
  discount       bigint not null default 0,
  fee            bigint not null,
  total          bigint not null,
  promo_code_id  uuid references promo_codes,
  status         text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'expired', 'refunded')),
  payment_method text not null check (payment_method in ('card', 'momo', 'zalopay', 'vietqr', 'mock')),
  provider_ref   text,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null,
  paid_at        timestamptz,
  refunded_at    timestamptz
);
create index orders_event on orders (event_id, status);
create index orders_user on orders (user_id, created_at desc);

create table event_staff (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events on delete cascade,
  name         text not null,
  phone        text not null,
  gate         text not null check (gate in ('main', 'vip', 'side')),
  role         text not null check (role in ('scanner', 'lead')),
  active       boolean not null default false,
  invited_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  scan_count   int not null default 0,
  last_seen_at timestamptz,
  unique (event_id, phone)
);

create table tickets (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid references orders,
  event_id         uuid not null references events,
  tier_id          uuid references ticket_tiers,
  user_id          uuid references users,
  code             text not null unique,
  holder_name      text not null default '',
  holder_phone     text,
  kind             text not null default 'ticket' check (kind in ('ticket', 'guest')),
  status           text not null default 'valid' check (status in ('valid', 'used', 'refunded', 'void')),
  checked_in_at    timestamptz,
  checked_in_gate  text,
  checked_in_by    uuid references event_staff on delete set null,
  wallet_apple_at  timestamptz,
  wallet_google_at timestamptz,
  resent_at        timestamptz,
  created_at       timestamptz not null default now()
);
create index tickets_event on tickets (event_id, status);
create index tickets_user on tickets (user_id);

create table scans (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events on delete cascade,
  ticket_id      uuid references tickets,
  code           text not null,
  staff_id       uuid references event_staff on delete set null,
  gate           text,
  device_id      text not null,
  client_scan_id text not null,
  result         text not null check (result in ('valid', 'duplicate', 'invalid')),
  reason         text,
  scanned_at     timestamptz not null,
  received_at    timestamptz not null default now(),
  was_offline    boolean not null default false,
  unique (device_id, client_scan_id)
);
create index scans_event on scans (event_id, scanned_at desc);

create table guest_list (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events on delete cascade,
  name          text not null,
  note          jsonb not null default '{"en":"","vi":""}',
  seats         int not null default 1 check (seats between 1 and 20),
  checked_in    boolean not null default false,
  checked_in_at timestamptz,
  created_at    timestamptz not null default now()
);

-- Money actually moved to an organiser. The ledger itself is computed from orders.
create table payout_transfers (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events on delete cascade,
  kind         text not null check (kind in ('advance', 'post_event', 'refund_hold')),
  amount       bigint not null,
  gross_basis  bigint not null,
  reference    text not null,
  paid_at      timestamptz not null default now(),
  unique (event_id, kind)
);
