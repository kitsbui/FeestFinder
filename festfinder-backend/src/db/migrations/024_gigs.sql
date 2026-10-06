-- The gig marketplace: organisers post slots they want filled, artists apply, organisers ask
-- an artist directly, and artists say when they are free. Fees are whole units of `currency`
-- (the city's), never a payment: money changes hands outside FeestFinder.

create table gig_opportunities (
  id               uuid primary key default gen_random_uuid(),
  organizer_id     uuid not null references organizers on delete cascade,
  event_id         uuid references events on delete set null,
  title            text not null,
  description      text not null default '',
  city             text not null references cities,
  starts_on        date not null,
  styles           text[] not null default '{}',
  gig_type         text check (gig_type in ('club', 'festival', 'rave', 'concert', 'brand_event', 'private', 'support', 'headline', 'b2b')),
  set_length       text check (set_length in ('60', '90', '120', 'open_format', 'all_night_long')),
  fee_min          bigint check (fee_min >= 0),
  fee_max          bigint check (fee_max >= 0),
  currency         text not null,
  travel_covered   boolean not null default false,
  closes_on        date,
  status           text not null default 'open' check (status in ('open', 'closed', 'filled')),
  created_by       uuid references users on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (fee_max is null or fee_min is null or fee_max >= fee_min)
);
create index gig_opportunities_open on gig_opportunities (starts_on) where status = 'open';
create index gig_opportunities_org on gig_opportunities (organizer_id, created_at desc);

create table gig_applications (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid not null references gig_opportunities on delete cascade,
  artist_id       uuid not null references artists on delete cascade,
  user_id         uuid references users on delete set null,
  message         text not null default '',
  -- Out of 100 when they applied (services/gigs.ts), so the organiser can sort; never shown as a verdict.
  match_score     int not null default 0,
  status          text not null default 'sent' check (status in ('sent', 'shortlisted', 'declined', 'booked', 'withdrawn')),
  created_at      timestamptz not null default now(),
  decided_at      timestamptz,
  unique (opportunity_id, artist_id)
);
create index gig_applications_artist on gig_applications (artist_id, created_at desc);

create table booking_inquiries (
  id            uuid primary key default gen_random_uuid(),
  organizer_id  uuid not null references organizers on delete cascade,
  artist_id     uuid not null references artists on delete cascade,
  from_user_id  uuid references users on delete set null,
  event_on      date not null,
  city          text not null references cities,
  message       text not null default '',
  fee_offer     bigint check (fee_offer >= 0),
  currency      text not null,
  status        text not null default 'sent' check (status in ('sent', 'accepted', 'declined', 'withdrawn')),
  reply         text not null default '',
  created_at    timestamptz not null default now(),
  answered_at   timestamptz
);
create index booking_inquiries_artist on booking_inquiries (artist_id, created_at desc);
create index booking_inquiries_org on booking_inquiries (organizer_id, created_at desc);

create table artist_availability (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references artists on delete cascade,
  from_on    date not null,
  to_on      date not null check (to_on >= from_on),
  kind       text not null check (kind in ('available', 'unavailable')),
  city       text references cities,
  note       text not null default ''
);
create index artist_availability_artist on artist_availability (artist_id, from_on);

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
