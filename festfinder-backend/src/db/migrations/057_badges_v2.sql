-- Raver badges v2 (growth plan card E): 53 achievements, up to six pinned on a profile.
alter table users add column badge_pins text[] not null default '{}';
-- Whether Feest Radar alone had found the night when the person said they were going ("Before the crowd").
alter table going add column origin_at_time text;
-- Codes the new catalogue no longer has (the ticket ones went in 051).
delete from badge_awards where code in ('events_100', 'all_styles', 'doors', 'sold_out', 'sold_out_5');
create index if not exists event_posts_user on event_posts (user_id, created_at);
create index if not exists share_visits_created on share_visits (created_at);
