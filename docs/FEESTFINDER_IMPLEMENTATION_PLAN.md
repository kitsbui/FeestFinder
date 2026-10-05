# FeestFinder Asia event intelligence: implementation plan

Plan of 2026-10-05 for the "Asia Event Intelligence" brief. It maps the brief onto the code as it stands ([CURRENT_ARCHITECTURE.md](CURRENT_ARCHITECTURE.md)) and fixes the debt that blocks it ([TECH_DEBT.md](TECH_DEBT.md)). Progress is tracked in [FEESTFINDER_ROADMAP.md](FEESTFINDER_ROADMAP.md).

## Decisions taken with the product owner (2026-10-05)

| Question | Decision | Consequence |
| --- | --- | --- |
| Crawling vs the community catalogue chosen on 2026-10-01 | **Hybrid.** Ingestion is one more source next to organisers and the community. | Imported events never publish themselves. They merge into an existing event, or wait in the `/ops` review queue as candidates. Claims, discussion and organiser control stay as they are. |
| Resident Advisor and Facebook | **No automated crawling of either.** | RA forbids scraping, and Meta closed public event search. RA/FB links that people paste are kept as provenance without being fetched. Sources are Ticketbox and other JSON-LD pages, ICS calendars and official APIs (Ticketmaster Discovery). |
| Map | **Bring it back now.** | MapLibre with self-hosted PMTiles (no per-request fees). It becomes a third view of `/list`, next to Table and Grid, sharing their filters. |
| Asia scope | **Open five cities now**: Bangkok, Tokyo, Singapore, Bali, plus Ho Chi Minh City. | Cities, timezones and currencies come from data. Hà Nội, Đà Nẵng and Nha Trang stay open. FeestFinder's own checkout stays VND-only; elsewhere the event links out to its ticket seller. |

## The brief mapped onto what exists

| Brief concept | Today | Plan |
| --- | --- | --- |
| Canonical `Event` | `events`, with moderation, SEO, commerce, community | **Keep `events` as the canonical table.** Add `country_code`, `currency`, `event_type`, `styles text[]`, `confidence_score`, `confidence`, `source_count`, `first_seen_at`, `last_seen_at`, `last_verified_at`. |
| `verificationStatus` | `status` (moderation lifecycle) | Cancelled stays a `status`. "Unverified / likely / verified / highly verified" is the confidence label. |
| `genres: string[]` | `genre`: one of 8 categories that also sets the colour | Keep `genre` as the **category** (colour, broad filter). Add `styles text[]` from a music taxonomy; each style belongs to a category. |
| `artists` entity | `lineup`/`artists text[]`; `artist_follows` by name | Keep the arrays. The `artists` + `event_artists` tables come in phase 7b. |
| `Venue` | `venues`: no normalised name, aliases, country or website | Extend `venues` and add a venue matcher. |
| City / country | 4-slug constant; fixed UTC+7; VND | New `countries` and `cities` tables (IANA timezone, currency, centre, bounds, `launched`), loaded once at boot into `lib/places.ts`. |
| `RawEvent` | none | New `raw_events`: every fetched record, its payload and hash, processing state, and the event it became. |
| `EventSource` | `events.event_url` | New `event_sources`: one row per (event, provider, external id or URL), with authority, match score and reason. Existing events are backfilled from their origin (organiser, community, team). |
| Source definitions and schedule | none | New `ingest_sources` (adapter, URL, config, city, authority, interval, ETag/Last-Modified/hash, next run) and `ingest_runs` (the brief's per-run counters). |
| `EventSourceAdapter` | `prefillFromJsonLd`, `fetchPublicPage`, `ClaudePrefill` | `services/ingest/` with `discover()` + `normalize()` adapters for website JSON-LD (single page or list page), ICS calendars, and Ticketmaster Discovery (official API, key-gated). |
| Deduplication | first-three-words + same-day check on submit | `services/ingest/resolve.ts`: the deterministic scorer from the brief, used by ingestion **and** community submissions. Exact provenance (provider + external id) is checked before fuzzy matching. |
| Confidence | `quality_score` (completeness), `risk_score` (moderation) | New `confidence_score` with a stored breakdown. Weights live in one config object (`services/ingest/confidence.ts`). Quality and risk keep their meaning. |
| Freshness | `updated_at` (content changes) | `first_seen_at`, `last_seen_at`, `last_verified_at` and a freshness label. |
| Map + bbox API | `/events/map?bbox` with no caller | MapLibre view, "Search this area", clustering, drawer card, URL state. The endpoint gains date, style, type, city, country and confidence filters and a 500-row cap. |
| List / timeline | Table + Grid over a 60-event snapshot | The list is queried on the server per filter with "load more". The table, sorted by date, is the timeline; grouping by day is cosmetic and comes later. |
| `GET /api/events` filters | `/events` with time, genre, city, artist, q, price | Add `country`, `style`, `type`, `venue`, `confidenceMin`, `source`, `bbox` to `/events` and `/events/map`. Paths keep their current names (no `/api` prefix: both fronts already call `/events`). |
| Scheduled ingestion | pg_cron → `/internal/jobs` → advisory locks | One `ingest` job in `jobs.ts` that works through due sources within a time budget per call. |
| Observability | `ctx.log` lines | `ingest_runs` rows plus one summary log line per run, shown in `/ops/sources`. |
| Admin / debugging | `/ops` review queue, catalogue | `/ops/sources` (sources, runs, run now) and a provenance panel on each event: sources, raw payload, confidence breakdown, match reason. |
| `EventSignal` / early warning | none | Postponed. A raw record that does not normalise into an event already stays in `raw_events` with a reason, which is the seed of a signal store. |
| Alerts | `smart_alerts` (genres, artists, organisers, areas, price) | Phase 7 adds cities and styles to Smart Alerts. "Festival within 500 km" is postponed. |
| AI | form fill-in only | Stays optional. Ingestion runs without AI, and style classification is deterministic first (source tags → keywords → lineup). An AI classifier is postponed. |
| Search | accent-free `search_text` + trigram | Unchanged. Semantic search is postponed. |

## What stays, what grows, what changes, what goes, what waits

**Unchanged:** the two fronts and their compile step, `/ops` and its review queue, auth, commerce, resale, the community features, SEO (`buildEventSeo`), caching, jobs and pg_cron, `fetchPublicPage`, the AI form fill-in.

**Extended:**
- `events` and `venues` gain columns.
- `/events` and `/events/map` gain filters.
- `smart_alerts` gains cities and styles.
- The `/ops` event editor gains styles, event type and a provenance panel.
- `prefillFromJsonLd` becomes a thin wrapper over the new JSON-LD normaliser.

**Refactored:**
- `lib/time.ts`: every event-time function takes a timezone, and the Vietnam helpers remain for back-office dates.
- Cities move from `CITIES` into `lib/places.ts` backed by tables.
- The web list queries the server instead of filtering a snapshot.
- The community duplicate check moves into the resolver.

**Removed:**
- The `CITY_LIST` copies in `pages/web/logic.js` and `pages/app/logic.js`; cities come from `/meta/places`.
- The `cityFrom()` regex list; places get aliases instead.
- Nothing user-facing is removed.

**Postponed:**
- RA and Facebook adapters (terms). Eventbrite (public search closed in 2020) and Bandsintown (partner key per artist).
- Playwright scraping.
- `EventSignal`, AI duplicate fallback, AI genre classifier, semantic search and recommendations.
- Artist pages and tour maps.
- FeestFinder checkout in currencies other than VND.

## Phase 1: canonical data (migration `016_intelligence.sql`)

```sql
countries (code pk, name jsonb, currency, timezone, sort)
cities    (slug pk, country_code fk, name jsonb, timezone, currency, lat, lng,
           bbox float8[4], aliases text[], launched bool, sort)
venues   + country_code, normalized_name, aliases text[], website, instagram, facebook, venue_type
events   + country_code, currency, event_type, styles text[], confidence_score, confidence,
           confidence_breakdown jsonb, source_count, first_seen_at, last_seen_at, last_verified_at
ingest_sources (id, adapter, name, url, city fk, authority, config jsonb, interval_minutes, enabled,
                etag, last_modified, content_hash, next_run_at, last_run_at, last_error)
raw_events (id, source_id fk, provider, external_id, source_url, payload jsonb, content_hash,
            fetched_at, last_seen_at, status, error, event_id fk, match_score, match_reason)
event_sources (id, event_id fk, provider, authority, external_id, source_url, raw_event_id fk,
               provider_confidence, match_score, match_reason, conflicts jsonb,
               first_seen_at, last_seen_at, published_at)
ingest_runs (id, source_id fk, started_at, finished_at, fetched, parsed, rejected, created,
             updated, merged, unchanged, errors jsonb)
```

- `events.city` and `venues.city` reference `cities(slug)`, so a city that does not exist cannot be stored.
- Provider and authority are text validated in TypeScript (`services/ingest/providers.ts`), so adding a provider needs no migration.
- Backfill: every existing event gets one `event_sources` row. The provider is `organizer`, `community` or `team`, the authority follows the organiser's verification, and the URL is `event_url`. `first_seen_at` is `created_at`; `last_verified_at` is the moderator's decision time.
- `starts_at`/`ends_at` are recomputed with the city's timezone. All existing cities are UTC+7, so no stored value changes.

## Phase 2: ingestion framework (`services/ingest/`)

```ts
interface SourceAdapter {
  readonly id: 'website' | 'ics' | 'ticketmaster';
  discover(source: IngestSource, io: IngestIO): Promise<RawRecord[]>;   // fetch only
  normalize(raw: RawRecord, source: IngestSource): NormalizedEvent | Rejection; // pure
}
```

- `IngestIO` carries the fetcher, the clock and a per-host limiter, so every adapter is tested on fixtures with no network.
- `runSource()` is idempotent:
  1. Discover.
  2. Upsert each `raw_events` row by `(source_id, external_id)`.
  3. If the content hash is unchanged and the record was already resolved, bump `last_seen_at` and continue.
  4. Otherwise normalise, resolve and apply.
  5. Write `ingest_runs`.
- Normalisation:
  - Times are kept with their source offset, falling back to the city's timezone.
  - The city comes from coordinates inside a city's bounds, then from aliases in the address. It must be a launched city, or the record is rejected as `out_of_area`.
  - The event must be upcoming, have a title and have a start date.
  - Text is cleaned of tags and capped.
  - Styles are classified deterministically.
- Responsible retrieval:
  - robots.txt is honoured for the `FeestFinderBot` user agent.
  - Requests are spaced at least 2 s apart per host, at most 2 run concurrently, and each source has a page cap.
  - ETag/If-Modified-Since and a content hash avoid refetching.
  - Retries back off.
- Scheduling: the `ingest` job runs every 5 minutes and takes due sources (`next_run_at <= now`) until a 40 s budget is spent. Each source sets its own interval: Ticketmaster 6 h, venue sites 12 h, festival sites 24 h.

## Phase 3: sources (replaces "Resident Advisor")

| Adapter | Used for | Authority |
| --- | --- | --- |
| `website` (JSON-LD) | Ticketbox event pages; venue, festival and promoter sites. One page, or a list page plus a link pattern. | per source: `official` / `ticketing` / `listing` |
| `ics` | public venue or promoter calendars (Google Calendar ICS) | per source |
| `ticketmaster` | Discovery API, music segment, by country/city (`TICKETMASTER_API_KEY`) | `ticketing` |
| `link` (no fetch) | RA, Facebook or Instagram links pasted by submitters or moderators | `listing` |

The first sources are entered in `/ops/sources` per city. The brief's success criterion (5 cities, 2+ sources, 500+ events) depends on configuring real sources in production. Code alone cannot deliver it.

## Phase 4: deduplication (`services/ingest/resolve.ts`)

1. **Exact provenance first.** An existing `event_sources` row with the same provider + external id, or the same canonical URL, is the match. This also stops a rejected candidate from coming back.
2. **Fuzzy score** against upcoming events within ±1 day in the same city:

| Signal | Points |
| --- | --- |
| normalised title equal, or one contains the other (accent-free, stop words removed) | +30 (token overlap ≥ 0.6: +20) |
| same venue (same `venue_id`, or normalised name/alias equal) | +25 |
| same start date | +25 |
| start time within 2 h | +10 |
| at least one artist in common | +10 |
| coordinates within 500 m | +10 |

3. **Outcome:**
   - ≥ 70: merge, which attaches the source and refreshes freshness and confidence. The match reason is stored, e.g. `title+venue+date`.
   - 45–69: a new candidate in review, flagged `duplicate`, with the score and reason shown.
   - Below 45: a new candidate in review.
4. A merge never overwrites what an organiser or moderator typed. A field that disagrees, such as the date or venue, is written into `event_sources.conflicts` and costs confidence.
5. Community submissions use the same scorer, which replaces the first-three-words check.

## Phase 5: confidence (`services/ingest/confidence.ts`)

| Rule | Points |
| --- | --- |
| Best source: official site or verified organiser account / ticketing / listing / community | 30 / 20 / 12 / 8 |
| Organiser verified on FeestFinder | +15 |
| Approved by a moderator | +10 |
| Second / third independent source (different host) | +10 / +10 |
| Venue pin resolved and verified | +10 |
| Ticket link checked OK | +5 |
| Stale (not seen for 14 days while upcoming) | −10 |
| Conflicting dates / venue mismatch between sources | −20 / −20 |

The score is clamped to 0–100. Labels: under 40 `low`, 40–69 `likely`, 70–89 `verified`, 90 and up `highly_verified`. The breakdown is stored for the debug panel. Freshness labels: `recent` (verified within 3 days), `updated` (within 14), `stale`, and cancelled from `status`. Cards carry `confidence {score, label, sources}`. The event page shows one line, "Xác minh từ N nguồn" (verified from N sources), with the source links.

## Phase 6: map discovery

- **Library:** MapLibre GL JS 6 (ES modules, a same-origin module worker, no `unsafe-eval`) and the `pmtiles` protocol. Both are vendored under `ui/vendor/maplibre/` and loaded only when the map view opens, through `ui/map/ff-map.js` and `FF.loadMap()` in both runtimes.
- **Tiles:** a Protomaps PMTiles extract covering the launched cities, hosted on the existing S3 bucket with range requests and set as `MAP_TILES_URL`. The API builds the Chalkboard style at `GET /map/style.json`, and the CSP adds the tile origin. Without `MAP_TILES_URL` the map draws the board colour, the city names and the events, so development and tests work offline.
- **Query:** the first view loads the selected city's bounds. Moving the map only shows "Tìm trong khu vực này" (search this area); pressing it queries the current bounds. Each answer is capped at 500 events and says when it was truncated ("zoom in to see more").
- **Rendering:** a GeoJSON source with clustering; event points are WebGL circles in genre colours. Cluster counts and city names are a handful of HTML markers, so no glyph fonts are needed.
- **The list:** it now asks `/events` for each set of filters (`upcoming=true`, 60 a page, "load more"), and the city chips count from the API's `facets.city`. It no longer filters a 60-event snapshot. A direct `/e/<slug>` link loads its event even when it is not on the first page.
- **Drawer card:** cover, title, date, venue, city, styles, confidence and source count, a ticket link and "Mở sự kiện" (open event).
- **URL state:** `/list?view=map&city=…&time=…&genre=…&style=…&bbox=…`.

## Phase 7: music intelligence

- Style taxonomy, each style in a category: techno family and house family → EDM, trance, psytrance, hardstyle family, bass family, mainstage → EDM. Hip-hop, R&B, pop, rock, indie and jazz map to their categories.
- Style chips in the list and map. Styles in the `/ops` editor and the submission form.
- Deterministic classifier: source tags and genre fields, then keyword matching on title, description and lineup.
- `event_type` (`club`, `festival`, `concert`, `rave`, `party`, `show`, `other`), inferred from the source and editable.
- Smart Alerts gain cities and styles.
- Phase 7b: `artists` + `event_artists`, artist pages, artist watchlist.

## Phase 8: five cities

- **Seed:** countries VN, TH, SG, ID, JP, KR, TW, HK, MY, PH. Launched cities: `ho-chi-minh`, `ha-noi`, `da-nang`, `nha-trang`, `bangkok`, `tokyo`, `singapore`, `bali`. Seeded but not launched: Phuket, Jakarta, Osaka, Seoul, Taipei, Hong Kong, Kuala Lumpur, Manila.
- **Time:** wall-clock times stay local to the event's city, and instants, windows and JSON-LD use the city's zone. None of these zones has daylight saving.
- **Money:** `events.currency` follows the city. Prices are shown with a currency-aware formatter in both runtimes. Ticket tiers and FeestFinder checkout refuse currencies other than VND.
- **UI:** city chips come from `/meta/places` (launched cities only, grouped by country). Copy stays bilingual vi/en.
- **Product limits:** writing still needs a proven phone (Decree 147). The community organiser and moderation queue are shared across cities.

## Testing

- Each adapter is tested on fixtures: `test/fixtures/ingest/*.html|ics|json`. Unit tests never make live requests.
- Normaliser cases: timezone conversion, missing fields, multi-day festivals, cancelled and rescheduled events, out-of-area records.
- Resolver cases: exact provenance, fuzzy merge, possible duplicate, no match, conflicting date.
- Confidence: rule table and labels.
- API: `/events` and `/events/map` filters, `/meta/places`, provenance endpoints, the ops source endpoints.
- Screens: the map view (renders, "search this area", drawer) and city chips, on both fronts.

## Licensing

No code is copied from the reference projects; they are used for ideas only. `nickk02/meridian` is AGPL-3.0 and must stay inspiration only. MapLibre GL JS is BSD-3-Clause and `pmtiles` is BSD-3-Clause, both compatible. Protomaps basemap data is OpenStreetMap (ODbL), so the map shows "© OpenStreetMap".
