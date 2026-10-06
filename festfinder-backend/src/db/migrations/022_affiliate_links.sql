-- Affiliate links beyond ticket buttons, and what each click says about where it came from.
--
-- 1. An affiliate link is a short code, /go/link/<code>, that sends people to a destination:
--    an artist's merch or a product page, a brand campaign, a partner's own page. It belongs to
--    an artist, an organiser or a partner, or to nobody (a FeestFinder campaign). A destination
--    on a partner's site goes out through that partner's tracking, like a ticket link.
-- 2. Every click, event or link, records the placement (the `source`), the kind of device and
--    the visitor's country as the CDN reports it. No IP address and no user agent are kept.
-- 3. A payout settles a partner's approved sales over a period: those sales become paid and
--    point at it, so one sale is never paid twice.

create table affiliate_links (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique check (code ~ '^[a-z0-9-]{3,40}$'),
  label            text not null,
  destination_url  text not null check (destination_url ~ '^https://'),
  kind             text not null default 'campaign' check (kind in ('artist', 'product', 'brand', 'campaign', 'partner')),
  artist_id        uuid references artists on delete cascade,
  organizer_id     uuid references organizers on delete cascade,
  partner_id       uuid references ticket_partners on delete set null,
  enabled          boolean not null default true,
  created_by       uuid references users on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index affiliate_links_artist on affiliate_links (artist_id) where artist_id is not null;
create index affiliate_links_organizer on affiliate_links (organizer_id) where organizer_id is not null;

alter table outbound_clicks alter column event_id drop not null;
alter table outbound_clicks add column link_id uuid references affiliate_links on delete cascade;
alter table outbound_clicks add constraint outbound_clicks_what check (event_id is not null or link_id is not null);
alter table outbound_clicks drop constraint outbound_clicks_target_check;
alter table outbound_clicks add constraint outbound_clicks_target_check check (target in ('partner', 'organizer', 'checkout', 'link'));
alter table outbound_clicks add column device text check (device in ('mobile', 'tablet', 'desktop'));
alter table outbound_clicks add column country text check (country ~ '^[A-Z]{2}$');
alter table outbound_clicks add column referrer_host text;
create index outbound_clicks_link on outbound_clicks (link_id, created_at) where link_id is not null;

create table affiliate_payouts (
  id           uuid primary key default gen_random_uuid(),
  partner_id   uuid not null references ticket_partners on delete cascade,
  period_from  date not null,
  period_to    date not null check (period_to >= period_from),
  currency     text not null,
  conversions  int not null default 0,
  amount       bigint not null default 0 check (amount >= 0),
  commission   bigint not null default 0 check (commission >= 0),
  status       text not null default 'open' check (status in ('open', 'paid')),
  note         text not null default '',
  created_by   uuid references users on delete set null,
  created_at   timestamptz not null default now(),
  paid_at      timestamptz
);
create index affiliate_payouts_partner on affiliate_payouts (partner_id, created_at desc);

alter table partner_conversions add column link_id uuid references affiliate_links on delete set null;
alter table partner_conversions add column payout_id uuid references affiliate_payouts on delete set null;

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
