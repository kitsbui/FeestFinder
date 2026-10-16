-- Advertising, in two kinds, every request answered by the team in the Console.
--
-- 1. An organiser promotes an event they posted (posting stays free and goes through review):
--    boost_requests, until now one bare "feature this" per event, become advertising requests
--    with the placements wanted, a budget, a timeline and a note; the team approves (with a
--    reply, and for the Explore banner a campaign made from the event) or declines. An open
--    request can be withdrawn.
-- 2. A brand books advertising (food and drink, fashion, health, beauty…): ad_inquiries carry the
--    brand's details (logo, website and social pages, product images as links, a description),
--    a contact, a budget, a timeline and the cities wanted. Approved, they become ad_campaigns,
--    which now carry the logo and images, a date window, cities, and the event an event ad is for.

alter table boost_requests
  add column placements text[] not null default '{featured}',
  add column budget bigint check (budget >= 0),
  add column currency text not null default 'VND',
  add column starts_on date,
  add column ends_on date,
  add column message text,
  add column reply text;
alter table boost_requests add constraint boost_requests_placements
  check (cardinality(placements) > 0 and placements <@ array['featured', 'banner', 'social']::text[]);
alter table boost_requests add constraint boost_requests_window check (starts_on is null or ends_on is null or ends_on >= starts_on);
alter table boost_requests drop constraint boost_requests_status_check;
alter table boost_requests add constraint boost_requests_status_check check (status in ('open', 'approved', 'declined', 'done', 'withdrawn'));
create index boost_requests_organizer on boost_requests (organizer_id, created_at desc);

alter table ad_inquiries drop constraint ad_inquiries_category_check;
alter table ad_inquiries add constraint ad_inquiries_category_check
  check (category in ('F&B', 'Fashion', 'Healthcare', 'Beauty', 'Tech', 'Travel', 'Lifestyle', 'Other'));
alter table ad_inquiries alter column budget drop not null;
alter table ad_inquiries
  add column logo_url text,
  add column website text,
  add column links jsonb not null default '{}',
  add column product_images text[] not null default '{}',
  add column description text not null default '',
  add column contact_name text,
  add column phone text,
  add column budget_amount bigint check (budget_amount >= 0),
  add column currency text not null default 'VND',
  add column starts_on date,
  add column ends_on date,
  add column cities text[] not null default '{}',
  add column is_alcohol boolean not null default false,
  add column reply text;
alter table ad_inquiries add constraint ad_inquiries_window check (starts_on is null or ends_on is null or ends_on >= starts_on);
create index ad_inquiries_user on ad_inquiries (user_id, created_at desc);

alter table ad_campaigns drop constraint ad_campaigns_category_check;
alter table ad_campaigns add constraint ad_campaigns_category_check
  check (category in ('F&B', 'Fashion', 'Healthcare', 'Beauty', 'Tech', 'Travel', 'Lifestyle', 'Other', 'Event'));
alter table ad_campaigns
  add column logo_url text,
  add column images text[] not null default '{}',
  add column starts_on date,
  add column ends_on date,
  add column cities text[] not null default '{}',
  add column event_id uuid references events on delete cascade,
  add column boost_id uuid references boost_requests on delete set null;
