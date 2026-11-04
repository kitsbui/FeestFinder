-- Radar ingestion was removed 2026-11-04: events are posted manually only.
-- Drop the ingest run history and raw event records. Keep ingest_sources for provenance
-- and manual posts, but drop columns no longer used.

drop table if exists ingest_runs cascade;
drop table if exists raw_events cascade;

-- event_sources had foreign keys to ingest_sources and raw_events; they are now gone.
-- Remove the raw_event_id column which nothing reads.
alter table event_sources drop column if exists raw_event_id;
