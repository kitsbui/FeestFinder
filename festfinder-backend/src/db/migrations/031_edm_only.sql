-- FeestFinder lists EDM only from here on. Every event goes, past ones too, with everything
-- attached to it, and ingestion forgets what it has read, so each source imports again from
-- scratch under the EDM rules on its next run, which is now.
--
-- Kept: accounts and sign-ins, organisers, artists, venues, the sources themselves, shelves,
-- collections, partners and their sales, gig posts, organiser inbox threads, chats between
-- friends, and the audit log (append-only).
--
-- Plain deletes in an order the foreign keys accept, not truncate ... cascade: a truncate of
-- events also empties every table that only points at an event (direct_messages,
-- inbox_threads, gig_opportunities, partner_conversions, artist_gig_reports) and, through
-- event_staff, every sign-in session. On an empty database, as in every test, each statement
-- touches nothing.

-- 1. What points at an event from a row that stays, read while the link is still there.
--    Event invites and waves in chats (an invite with no event shows as an empty bubble).
delete from direct_messages where kind in ('invite', 'wave');
--    Bell notifications that open an event, a plan, an order or a ticket screen.
delete from notifications
 where link->>'eventId' is not null or link->>'planId' is not null or link->>'orderId' is not null
    or link->>'screen' in ('event', 'live', 'dash', 'money', 'door', 'plan', 'tickets');
--    Messages queued or sent about them, so nothing still goes out about a deleted night.
delete from outbox
 where announcement_id is not null or template in ('announcement', 'ticket_resend', 'staff_invite')
    or payload->'link'->>'eventId' is not null or payload->'link'->>'planId' is not null or payload->'link'->>'orderId' is not null
    or payload->'link'->>'screen' in ('event', 'live', 'dash', 'money', 'door', 'plan', 'tickets');

-- 2. Tickets and money. These reference events, tiers and each other without a cascade
--    (NO ACTION), so they go first, the rows that point at others before the rows they point at.
delete from ticket_transfers;
delete from resale_orders;
delete from ticket_listings;
delete from scans;
delete from tickets;
delete from orders;

-- 3. Ingestion's memory: where each event came from, every record sources sent, the run log
--    and what artists reported. Event sources first, so deleting the raw records does not
--    first rewrite them.
delete from event_sources;
delete from raw_events;
delete from ingest_runs;
delete from artist_gig_reports;
--    The sources stay, forgetting what they last sent (conditional-request headers and the
--    page hash that make an unchanged page a no-op) and due now.
update ingest_sources
   set etag = null, last_modified = null, content_hash = null, last_run_at = null, last_error = null, next_run_at = now();

-- 4. The events. Every remaining table that hangs off an event goes with them (ON DELETE CASCADE):
--    ticket tiers, promo codes, stages, sets and plan picks, site zones and presence, crew and
--    their door sessions, guest lists, payout transfers, saves, hypes, going, collection items,
--    shelf items, recaps, listing reports, group plans with their members, messages and payment
--    requests, tier and resale watchers, discussion posts with votes and reports, hype goals,
--    shares and share visits, event updates, announcements, moderation decisions and appeals, claims, boost
--    requests, AI guides, daily views, ticket clicks and event_artists. Gig posts, inbox threads
--    and partner sales keep their row with event_id set to null.
delete from events;

-- 5. Tell search engines again about every event page they were told about, so they find each
--    one gone (IndexNow takes deleted pages too). Without INDEXNOW_KEY nothing is ever sent and
--    this table is empty.
insert into indexnow_queue (url, queued_at)
select url, now() from indexnow_sent where url ~ '/e/[^/?]+$'
on conflict (url) do update set queued_at = excluded.queued_at;

-- 6. EDM is the only genre (lib/i18n.ts GENRES). An event's genre is EDM, or null for an
--    imported candidate no source classified, until a moderator approves it as EDM. New
--    listings are EDM unless they say otherwise.
alter table events drop constraint events_genre_check;
alter table events add constraint events_genre_check check (genre = 'EDM');
alter table events alter column genre set default 'EDM';
--    Sending a listing back because it is not electronic music.
alter table moderation_decisions drop constraint moderation_decisions_reason_code_check;
alter table moderation_decisions add constraint moderation_decisions_reason_code_check
  check (reason_code in ('venue', 'ticket', 'image', 'permit', 'duplicate', 'policy', 'genre'));

-- 7. Sources that list every kind of music import only records naming an EDM style
--    (services/ingest/starter.ts adds this to new rows; these are the rows already added).
update ingest_sources set config = config || '{"requireStyle": true}'::jsonb
 where adapter = 'ticketmaster' or url like '%ticketgo.vn/%';

-- 8. Stored choices of other genres and styles go. An alert or an ad aimed only at them is
--    switched off rather than widened (an empty list means everything).
update smart_alerts set enabled = false
 where enabled and ((cardinality(genres) > 0 and not 'EDM' = any(genres))
    or (cardinality(styles) > 0 and not styles && array['techno','hard-techno','acid-techno','industrial-techno','house','tech-house','deep-house','progressive-house','trance','psytrance','hardstyle','rawstyle','hardcore','gabber','dubstep','drum-and-bass','breakbeat','bass','edm','mainstage']));
update ad_campaigns set active = false where active and cardinality(genres) > 0 and not 'EDM' = any(genres);
update smart_alerts set genres = array(select g from unnest(genres) g where g = 'EDM') where not genres <@ array['EDM'];
update ad_campaigns set genres = array(select g from unnest(genres) g where g = 'EDM') where not genres <@ array['EDM'];
update users set interests = array(select i from unnest(interests) i where i = any(array['EDM','techno','hard-techno','acid-techno','industrial-techno','house','tech-house','deep-house','progressive-house','trance','psytrance','hardstyle','rawstyle','hardcore','gabber','dubstep','drum-and-bass','breakbeat','bass','edm','mainstage']))
 where not interests <@ array['EDM','techno','hard-techno','acid-techno','industrial-techno','house','tech-house','deep-house','progressive-house','trance','psytrance','hardstyle','rawstyle','hardcore','gabber','dubstep','drum-and-bass','breakbeat','bass','edm','mainstage'];
update smart_alerts set styles = array(select s from unnest(styles) with ordinality x(s, n) where s = any(array['techno','hard-techno','acid-techno','industrial-techno','house','tech-house','deep-house','progressive-house','trance','psytrance','hardstyle','rawstyle','hardcore','gabber','dubstep','drum-and-bass','breakbeat','bass','edm','mainstage']) order by n)
 where not styles <@ array['techno','hard-techno','acid-techno','industrial-techno','house','tech-house','deep-house','progressive-house','trance','psytrance','hardstyle','rawstyle','hardcore','gabber','dubstep','drum-and-bass','breakbeat','bass','edm','mainstage'];
update artists set styles = array(select s from unnest(styles) with ordinality x(s, n) where s = any(array['techno','hard-techno','acid-techno','industrial-techno','house','tech-house','deep-house','progressive-house','trance','psytrance','hardstyle','rawstyle','hardcore','gabber','dubstep','drum-and-bass','breakbeat','bass','edm','mainstage']) order by n)
 where not styles <@ array['techno','hard-techno','acid-techno','industrial-techno','house','tech-house','deep-house','progressive-house','trance','psytrance','hardstyle','rawstyle','hardcore','gabber','dubstep','drum-and-bass','breakbeat','bass','edm','mainstage'];
update organizers set styles = array(select s from unnest(styles) with ordinality x(s, n) where s = any(array['techno','hard-techno','acid-techno','industrial-techno','house','tech-house','deep-house','progressive-house','trance','psytrance','hardstyle','rawstyle','hardcore','gabber','dubstep','drum-and-bass','breakbeat','bass','edm','mainstage']) order by n)
 where not styles <@ array['techno','hard-techno','acid-techno','industrial-techno','house','tech-house','deep-house','progressive-house','trance','psytrance','hardstyle','rawstyle','hardcore','gabber','dubstep','drum-and-bass','breakbeat','bass','edm','mainstage'];
update gig_opportunities set styles = array(select s from unnest(styles) with ordinality x(s, n) where s = any(array['techno','hard-techno','acid-techno','industrial-techno','house','tech-house','deep-house','progressive-house','trance','psytrance','hardstyle','rawstyle','hardcore','gabber','dubstep','drum-and-bass','breakbeat','bass','edm','mainstage']) order by n)
 where not styles <@ array['techno','hard-techno','acid-techno','industrial-techno','house','tech-house','deep-house','progressive-house','trance','psytrance','hardstyle','rawstyle','hardcore','gabber','dubstep','drum-and-bass','breakbeat','bass','edm','mainstage'];
update brand_campaigns set styles = array(select s from unnest(styles) with ordinality x(s, n) where s = any(array['techno','hard-techno','acid-techno','industrial-techno','house','tech-house','deep-house','progressive-house','trance','psytrance','hardstyle','rawstyle','hardcore','gabber','dubstep','drum-and-bass','breakbeat','bass','edm','mainstage']) order by n)
 where not styles <@ array['techno','hard-techno','acid-techno','industrial-techno','house','tech-house','deep-house','progressive-house','trance','psytrance','hardstyle','rawstyle','hardcore','gabber','dubstep','drum-and-bass','breakbeat','bass','edm','mainstage'];
