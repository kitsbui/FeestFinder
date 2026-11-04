-- One-off: turn Feest Radar off, wipe every event and every artist profile (owner, 2026-11-04).
-- Run in the Supabase SQL editor of the production project, in one go.
-- Everything hanging off an event (sources, lineups, saves, comments, clicks, plans, moments…) goes with it;
-- rows that only point at an event (mixes, projects, gig reports, notifications) keep their row, the pointer set null.
begin;

-- Radar's sources: off (the code that ran them left with migration 068).
update ingest_sources set enabled = false;

-- The archived ticketing rows reference events without cascade, in this order.
delete from archive_ticketing.ticket_transfers;
delete from archive_ticketing.scans;
delete from archive_ticketing.resale_orders;
delete from archive_ticketing.ticket_listings;
delete from archive_ticketing.tickets;
delete from archive_ticketing.orders;

update events set previous_edition_id = null;
delete from events;

-- Artist profiles: follows, claims, mixes, tracks, gig reports and the artist role go with them; a project's wished artist keeps its name.
delete from artists;

commit;
