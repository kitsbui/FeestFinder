-- Ticket partners: the sites FeestFinder sends people to for tickets, and what each sale earns.
--
-- 1. A partner is a ticket seller FeestFinder has an affiliate deal with. `hosts` are the
--    sites it sells on; an event whose ticket link is on one of them goes out through the
--    partner's tracking (`link_template`, or `link_params` added to the link). `{click}` in
--    either becomes the click's id, so a sale reported later can be matched to it.
-- 2. Every press of a ticket button is one outbound_clicks row, partner or not.
-- 3. A partner reports sales to /partners/<slug>/postback with its own token (only its hash
--    is kept here). One row per order; a later report of the same order updates it.

create table ticket_partners (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name                 text not null,
  hosts                text[] not null default '{}',
  link_template        text,
  link_params          jsonb not null default '{}',
  commission_pct       numeric(5,2) not null default 0 check (commission_pct >= 0 and commission_pct <= 100),
  postback_token_hash  text,
  enabled              boolean not null default true,
  notes                text not null default '',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table outbound_clicks (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events on delete cascade,
  partner_id   uuid references ticket_partners on delete set null,
  user_id      uuid references users on delete set null,
  source       text not null default 'detail',
  target       text not null check (target in ('partner', 'organizer', 'checkout')),
  target_host  text,
  created_at   timestamptz not null default now()
);
create index outbound_clicks_event on outbound_clicks (event_id, created_at);
create index outbound_clicks_partner on outbound_clicks (partner_id, created_at);

create table partner_conversions (
  id           uuid primary key default gen_random_uuid(),
  partner_id   uuid not null references ticket_partners on delete cascade,
  click_id     uuid references outbound_clicks on delete set null,
  event_id     uuid references events on delete set null,
  order_ref    text not null,
  amount       bigint not null default 0 check (amount >= 0),
  currency     text not null default 'VND',
  commission   bigint not null default 0 check (commission >= 0),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid')),
  occurred_at  timestamptz not null default now(),
  received_at  timestamptz not null default now(),
  payload      jsonb not null default '{}',
  unique (partner_id, order_ref)
);
create index partner_conversions_partner on partner_conversions (partner_id, occurred_at desc);

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
