-- Comments like a feed (owner, 2026-10-20): one stream per event, and a reply to a reply. A reply
-- still hangs off the first post of its thread (parent_id), shown flat under it; reply_to_user_id
-- says whom it answers, so the screen writes "@name" and that person is told.
alter table event_posts add column if not exists reply_to_user_id uuid references users on delete set null;
create index if not exists event_posts_event_new on event_posts (event_id, created_at desc) where parent_id is null;
