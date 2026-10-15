-- Who put an event on FeestFinder, so people can tell the two apart: someone posted it (an
-- organiser, the community, the team, an artist's report), or FeestFinder Radar found it on
-- another site (a website, an ICS feed, a ticket seller) and nobody here has posted it yet. Kept
-- current by refreshConfidence (services/ingest/confidence.ts) whenever its sources change: an
-- organiser claiming a Radar event makes it posted.
alter table events add column origin text not null default 'posted' check (origin in ('posted', 'radar'));

update events e set origin = 'radar'
 where exists (select 1 from event_sources s where s.event_id = e.id)
   and not exists (select 1 from event_sources s where s.event_id = e.id and s.provider in ('organizer', 'community', 'team', 'artist'));

create index events_origin on events (origin) where status = 'live';
