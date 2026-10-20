-- A featured shelf on the home page (growth plan card 5, tech debt 17): the team marks the ones a
-- brand or an organiser paid for, so the page says "Được tài trợ"; a shelf may keep to some cities
-- (empty: every city).
alter table shelves add column sponsored boolean not null default false;
alter table shelves add column cities text[] not null default '{}';
