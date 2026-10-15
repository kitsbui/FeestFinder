---
name: feestfinder-radar-adapter
description: Add or change a FeestFinder Radar ingestion adapter (websites, ICS, Ticketmaster…) in festfinder-backend/src/services/ingest. Use when asked to read events from a new kind of source.
---

# A Radar adapter

FeestFinder Radar (ingestion) is one more source next to organisers and the community, never a publisher: imports merge into an event or wait in the review queue, and what only Radar found is shown as Radar (`events.origin`, migration 032).

1. Never for Resident Advisor or Facebook: their terms forbid it; their links are kept as provenance only (`providers.ts` `LINK_ONLY`).
2. Write the adapter in `services/ingest/adapters/<name>.ts` with `discover(source, io)` and `normalize(record, ctx)`, and add it to `ADAPTERS`. Fetch only through `io` (robots.txt, per-host spacing, the deadline); API keys come from `io.secrets`, never from the source row.
3. Normalise through `finalize` (`normalize.ts`): the city from `lib/places.ts`, local times with `atZone`, prices in the city's currency. Drop other genres (`OTHER_GENRES`); a source that lists every kind of music sets `requireStyle`.
4. Tests in `test/ingest.test.ts` against fixtures in `test/fixtures/ingest/` (no live requests): parsing, normalising, a full run through `/admin/sources/:id/run` with `fakeIO`, and merging into an existing event.
5. If the preview should show it, add its fixture to `test/fixtures/radar.ts`.
