-- Search and a few indexes the hot paths want once there is real data in the tables.

-- The feed searches with `search_text like '%needle%'` (diacritics already stripped by
-- searchNormalize, so "da lat" finds "Đà Lạt"). A leading wildcard cannot use a B-tree,
-- so this needs a trigram index — without it every search scans the table.
--
-- PGlite has no extensions, so development and tests fall back to the sequential scan,
-- which is what they were doing anyway. Guarded so a missing extension is a notice, not
-- a failed migration.
do $$
begin
  create extension if not exists pg_trgm;
  create index if not exists events_search_trgm on events using gin (search_text gin_trgm_ops);
exception when others then
  raise notice 'pg_trgm unavailable, search falls back to a scan: %', sqlerrm;
end $$;

-- Every "who is going / who saved this" count on the organiser and admin screens.
create index if not exists saves_user on saves (user_id, created_at desc);
create index if not exists hypes_event on hypes (event_id);

-- The queue orders by how long a listing has been waiting.
create index if not exists events_in_review on events (submitted_at) where status = 'in_review';

-- Reports are read per listing and per open state.
create index if not exists listing_reports_open on listing_reports (event_id) where resolved_at is null;

-- Presence and the door screen both read by event.
create index if not exists presence_event on presence (event_id, updated_at desc);

-- The audit log is read newest-first, and verified in sequence order.
create index if not exists audit_log_at on audit_log (at desc);
