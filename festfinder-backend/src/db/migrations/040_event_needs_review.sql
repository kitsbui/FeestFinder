-- A live listing stays live while an organiser's change waits for review.
--
-- Until now, changing a reviewed field (title, dates, times, venue, entry, price, cover) on a
-- live listing moved it back to in_review, and an in_review listing is not public: the event
-- page answered 404 and ticket sales stopped until the team looked. Now the change applies and
-- the listing stays live, carrying a flag the review queue reads: when the change was made,
-- which fields changed, and what they were before. The team approves (the flag clears) or
-- sends it back (the old values return). Nothing is deleted; a listing with no flag is as before.

alter table events add column needs_review_at timestamptz;
alter table events add column needs_review_fields text[] not null default '{}';
alter table events add column needs_review_before jsonb;

create index events_needs_review on events (needs_review_at) where needs_review_at is not null;
