-- Feest Radar (owner, 2026-10-17). The organiser that holds what FeestFinder's ingestion finds
-- (and what the community sends in) until someone claims it is called Feest Radar, at
-- /o/feest-radar (the web redirects /o/cong-dong). Each event gets a fit score for the team (how
-- well it suits FeestFinder, from what the project and its people want: services/ingest/fit.ts),
-- the festival brand it belongs to (lib/festivals.ts), and an "expired" status: a Radar find is
-- cleared a day after it ends (its last day, for a festival of several), never deleted.

update organizers set name = 'Feest Radar', initials = 'FR',
       bio = '{"en":"Electronic nights and festivals Feest Radar found on public pages, and the ones people sent in. A moderator checks each one before it goes live.","vi":"Đêm nhạc điện tử và lễ hội do Feest Radar tìm thấy trên các trang công khai, cùng tin mọi người gửi lên. Mỗi tin đều được kiểm duyệt trước khi lên sóng."}'::jsonb
 where is_community;
update organizers set slug = 'feest-radar'
 where is_community and slug = 'cong-dong' and not exists (select 1 from organizers o where o.slug = 'feest-radar');

alter table events add column if not exists festival text;
alter table events add column if not exists fit_score smallint check (fit_score between 0 and 100);
alter table events add column if not exists fit_reasons jsonb not null default '[]';
alter table events add column if not exists fit_at timestamptz;
alter table events add column if not exists expired_at timestamptz;

alter table events drop constraint if exists events_status_check;
alter table events add constraint events_status_check
  check (status in ('draft', 'in_review', 'live', 'rejected', 'removed', 'cancelled', 'expired'));

create index if not exists events_radar_ends on events (ends_at) where origin = 'radar' and status in ('live', 'in_review');
create index if not exists events_festival on events (festival, starts_at) where festival is not null;
