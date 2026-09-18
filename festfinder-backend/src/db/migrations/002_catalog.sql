-- Organisers, venues, events, ticket tiers, timetables and editorial shelves.

create table organizers (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  name               text not null,
  initials           text not null,
  type               text not null default 'promoter' check (type in ('promoter', 'venue', 'company', 'agency', 'public')),
  bio                jsonb not null default '{"en":"","vi":""}',
  art                text,
  logo_url           text,
  website            text,
  legal_name         text,
  tax_code           text,
  address            text,
  email              text,
  hotline            text,
  zalo               text,
  contact_name       text,
  contact_role       text,
  since_year         int not null default extract(year from now()),
  followers_count    int not null default 0,
  verification_state text not null default 'pending' check (verification_state in ('pending', 'verified', 'flagged')),
  doc_id             boolean not null default false,
  doc_tax            boolean not null default false,
  doc_bank           boolean not null default false,
  strikes            int not null default 0,
  suspended_at       timestamptz,
  bank_name          text,
  bank_bin           text,
  bank_account_no    text,
  bank_account_name  text,
  bank_verified      boolean not null default false,
  bank_added_at      timestamptz,
  created_at         timestamptz not null default now()
);

create table organizer_members (
  organizer_id uuid not null references organizers on delete cascade,
  user_id      uuid not null references users on delete cascade,
  role         text not null default 'owner' check (role in ('owner', 'manager')),
  primary key (organizer_id, user_id)
);
create index organizer_members_user on organizer_members (user_id);

create table venues (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  address        text not null,
  area           text not null,
  city           text not null default 'ho-chi-minh',
  lat            double precision not null,
  lng            double precision not null,
  verified       boolean not null default true,
  permit_on_file boolean not null default false
);

create table events (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  organizer_id        uuid not null references organizers,
  title               text not null,
  genre               text check (genre in ('EDM', 'Festival', 'Indie', 'Hip-Hop', 'Pop', 'Jazz', 'Food', 'Culture')),
  description         jsonb not null default '{"en":"","vi":""}',
  city                text not null default 'ho-chi-minh',
  venue_id            uuid references venues,
  venue_name          text,
  address             text,
  area                text,
  lat                 double precision,
  lng                 double precision,
  starts_on           date,
  ends_on             date,
  start_time          text check (start_time ~ '^\d{2}:\d{2}$'),
  end_time            text check (end_time ~ '^\d{2}:\d{2}$'),
  starts_at           timestamptz,
  ends_at             timestamptz,
  entry_mode          text not null default 'paid' check (entry_mode in ('free', 'paid', 'donation')),
  price_from          bigint not null default 0,
  capacity            int,
  age                 text not null default 'All ages' check (age in ('All ages', '16+', '18+')),
  lineup              text[] not null default '{}',
  artists             text[] not null default '{}',
  art                 text,
  cover_url           text,
  cover_sha256        text,
  logo_url            text,
  ticket_url          text,
  event_url           text,
  brand_url           text,
  badge               text check (badge in ('trending', 'low_tickets', 'selling_fast', 'going_500', 'just_added')),
  featured            boolean not null default false,
  sold_out            boolean not null default false,
  hype_count          int not null default 0,
  save_count          int not null default 0,
  status              text not null default 'draft' check (status in ('draft', 'in_review', 'live', 'rejected', 'removed', 'cancelled')),
  held_for_reports    boolean not null default false,
  submitted_at        timestamptz,
  decided_at          timestamptz,
  published_at        timestamptz,
  quality_score       int,
  risk_score          int,
  risk_factors        jsonb not null default '[]',
  signals             jsonb not null default '[]',
  flag                text check (flag in ('venue', 'ticket', 'image', 'permit', 'duplicate', 'policy')),
  ticket_link_status  text check (ticket_link_status in ('ok', 'broken', 'unchecked')),
  previous_edition_id uuid references events,
  search_text         text not null default '',   -- title, venue, area, genre, artists without diacritics
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index events_feed on events (status, starts_on) where status = 'live';
create index events_organizer on events (organizer_id);
create index events_artists on events using gin (artists);

create table ticket_tiers (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events on delete cascade,
  key            text not null,
  name           jsonb not null,
  note           jsonb,
  price          bigint not null check (price >= 0),
  capacity       int not null check (capacity >= 0),
  sold           int not null default 0 check (sold >= 0),
  is_last        boolean not null default false,
  sales_open_at  timestamptz,
  price_rise_on  date,
  price_rise_to  bigint,
  sort           int not null default 0,
  unique (event_id, key)
);

create table stages (
  id       uuid primary key default gen_random_uuid(),
  event_id uuid not null references events on delete cascade,
  name     jsonb not null,
  sort     int not null default 0
);

create table sets (
  id        uuid primary key default gen_random_uuid(),
  event_id  uuid not null references events on delete cascade,
  stage_id  uuid not null references stages on delete cascade,
  day       date not null,
  artist    text not null,
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  check (ends_at > starts_at)
);
create index sets_event_day on sets (event_id, day);

-- On-site map zones, positioned in percent of the map box.
create table site_zones (
  id       uuid primary key default gen_random_uuid(),
  event_id uuid not null references events on delete cascade,
  label    text not null,
  kind     text not null check (kind in ('stage', 'food', 'entry', 'medical', 'toilets', 'water', 'bar')),
  x        real not null,
  y        real not null,
  w        real not null
);

create table shelves (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       jsonb not null,
  note       jsonb not null default '{"en":"","vi":""}',
  enabled    boolean not null default false,
  starts_on  date,
  ends_on    date,
  sort       int not null default 0,
  created_at timestamptz not null default now()
);

create table shelf_items (
  shelf_id uuid not null references shelves on delete cascade,
  event_id uuid not null references events on delete cascade,
  sort     int not null default 0,
  primary key (shelf_id, event_id)
);

-- Editorial FAQ blocks for programmatic SEO landing pages.
create table seo_faqs (
  id       uuid primary key default gen_random_uuid(),
  path     text not null,          -- e.g. ho-chi-minh/all/this-weekend
  question jsonb not null,
  answer   jsonb not null,
  sort     int not null default 0
);
create index seo_faqs_path on seo_faqs (path, sort);
