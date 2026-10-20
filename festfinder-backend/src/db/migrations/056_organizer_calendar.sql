-- An organiser's own calendar as a source (growth plan card 1): its events come in under that
-- organiser (posted, not Radar) and wait in the review queue like anything else they send.
alter table ingest_sources add column organizer_id uuid references organizers on delete cascade;
create unique index ingest_sources_organizer on ingest_sources (organizer_id) where organizer_id is not null;
