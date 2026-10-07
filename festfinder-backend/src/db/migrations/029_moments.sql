-- Moments: up to nine pictures on a profile (a fan's own, an artist's, an organiser's), each an
-- image uploaded to FeestFinder's own storage (the CSP allows no other image host), with a
-- caption and a date. Anyone signed in can report one; a moderator removes it or keeps it.
create table moments (
  id             uuid primary key default gen_random_uuid(),
  owner_kind     text not null check (owner_kind in ('user', 'artist', 'organizer')),
  owner_id       uuid not null,
  url            text not null,
  caption        text,
  taken_on       date,
  sort           int not null default 0,
  created_by     uuid not null references users on delete cascade,
  created_at     timestamptz not null default now(),
  removed_at     timestamptz,
  removed_by     uuid references users on delete set null,
  removed_reason text
);
create index moments_owner on moments (owner_kind, owner_id, sort) where removed_at is null;

create table moment_reports (
  moment_id   uuid not null references moments on delete cascade,
  user_id     uuid not null references users on delete cascade,
  reason      text not null check (reason in ('not_mine', 'offensive', 'unsafe', 'spam')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  resolution  text,
  primary key (moment_id, user_id)
);
create index moment_reports_open on moment_reports (created_at) where resolved_at is null;

-- Moments are uploaded as their own purpose.
alter table uploads drop constraint uploads_purpose_check;
alter table uploads add constraint uploads_purpose_check check (purpose in ('cover', 'logo', 'avatar', 'recap', 'moment'));
