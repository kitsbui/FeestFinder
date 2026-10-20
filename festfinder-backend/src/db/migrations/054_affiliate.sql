-- Smart affiliate links (growth plan card D, owner 2026-10-20: FeestFinder sells no tickets).
-- Who referred a ticket click is kept on the click and copied to the partner's sale; an approved
-- sale earns the referrer a share of FeestFinder's commission, paid by the team by period.

-- The person whose share link brought the visitor (never the visitor themselves).
alter table outbound_clicks add column ref_user uuid references users on delete set null;
create index outbound_clicks_ref on outbound_clicks (ref_user, created_at) where ref_user is not null;
alter table partner_conversions add column ref_user uuid references users on delete set null;

-- More sellers than the main ticket link, each for the viewers of some countries:
-- [{"url": "https://…", "countries": ["SG", "MY"]}]. events.ticket_url stays the main one.
alter table events add column ticket_links jsonb not null default '[]'
  check (jsonb_typeof(ticket_links) = 'array');

create table ambassador_payouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users on delete cascade,
  amount       bigint not null check (amount >= 0),
  earnings     int not null default 0,
  status       text not null default 'open' check (status in ('open', 'paid')),
  note         text not null default '',
  created_by   uuid references users on delete set null,
  created_at   timestamptz not null default now(),
  paid_at      timestamptz
);
create index ambassador_payouts_user on ambassador_payouts (user_id, created_at desc);

-- One earning per partner sale that a referrer brought. amount is in VND, from the sale's
-- commission (amount_src in currency) at the fixed rate in lib/money.ts.
create table ambassador_earnings (
  id             uuid primary key default gen_random_uuid(),
  conversion_id  uuid not null unique references partner_conversions on delete cascade,
  user_id        uuid not null references users on delete cascade,
  event_id       uuid references events on delete set null,
  partner_id     uuid references ticket_partners on delete set null,
  currency       text not null,
  amount_src     bigint not null default 0 check (amount_src >= 0),
  amount         bigint check (amount >= 0),
  status         text not null default 'pending' check (status in ('pending', 'payable', 'paid', 'void')),
  reason         text,
  payout_id      uuid references ambassador_payouts on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index ambassador_earnings_user on ambassador_earnings (user_id, status);

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
