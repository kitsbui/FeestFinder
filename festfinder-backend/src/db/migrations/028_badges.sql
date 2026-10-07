-- Badges: milestones a fan, an artist or an organiser reaches. The catalogue and its rules are
-- code (services/badges.ts); this keeps who earned which, and when, so a badge shows the day it
-- was earned, "new" until its owner has seen it, and how rare it is among its role.
create table badge_awards (
  subject_kind text not null check (subject_kind in ('user', 'artist', 'organizer')),
  subject_id   uuid not null,
  code         text not null,
  earned_at    timestamptz not null,
  seen_at      timestamptz,
  primary key (subject_kind, subject_id, code)
);
create index badge_awards_code on badge_awards (subject_kind, code);
