-- Brand campaigns: a brand wants artists for a launch, a content series, a sponsored set. The
-- team posts the campaign on the brand's behalf (brands have no accounts yet); artists who
-- marked themselves open to brands say they are interested, and the team picks. Fees are a
-- starting point in `currency`, never a payment through FeestFinder.

create table brand_campaigns (
  id                 uuid primary key default gen_random_uuid(),
  brand_name         text not null,
  title              text not null,
  brief              text not null default '',
  cities             text[] not null default '{}',
  styles             text[] not null default '{}',
  fee_min            bigint check (fee_min >= 0),
  fee_max            bigint check (fee_max >= 0),
  currency           text not null,
  starts_on          date,
  closes_on          date,
  status             text not null default 'open' check (status in ('draft', 'open', 'closed')),
  affiliate_link_id  uuid references affiliate_links on delete set null,
  created_by         uuid references users on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (fee_max is null or fee_min is null or fee_max >= fee_min)
);
create index brand_campaigns_open on brand_campaigns (closes_on) where status = 'open';

create table brand_campaign_interests (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references brand_campaigns on delete cascade,
  artist_id    uuid not null references artists on delete cascade,
  user_id      uuid references users on delete set null,
  message      text not null default '',
  status       text not null default 'sent' check (status in ('sent', 'shortlisted', 'declined', 'selected', 'withdrawn')),
  created_at   timestamptz not null default now(),
  decided_at   timestamptz,
  unique (campaign_id, artist_id)
);
create index brand_campaign_interests_artist on brand_campaign_interests (artist_id, created_at desc);

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
