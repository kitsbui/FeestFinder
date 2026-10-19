# Reliability

What FeestFinder promises about being up and fast, how it is measured, and what happens when it is not. Started with design v2's "Liên tục" items (artboard 23 of the design review, 2026-10-18).

## Service levels

Measured over 28 days, in production (`feestfinder.com`, the `feestfinder-web` and `feestfinder` Vercel projects in `hnd1`).

| What | Objective | Measured by |
| --- | --- | --- |
| The site answers | 99.5% of the 15-minute checks pass (about 3.5 hours down a month at most) | `.github/workflows/uptime.yml`: `/`, `/health` (the API and its database through the proxy), `/events?limit=1`, `/sitemap.xml` |
| Public reads are fast | p95 under 500 ms at the API for `PUBLIC_READS` (`app.ts`), under 1.5 s for a page's HTML | Vercel Observability (the API project's route latency; the web project's function duration) |
| Few errors | under 0.5% of API responses are 5xx; under 0.1% of measured pages report an uncaught browser error (artboard 26, phase 19) | Vercel Observability (status codes); the Console's "Số liệu" reads `web_signals` (every page's Web Vitals and uncaught errors, 30 days, `services/web-signals.ts`); Sentry once `SENTRY_DSN` is set (`POST /client-errors` and the API's own); the hourly `webHealth` job tells every admin when an hour passes 0.1% on a hundred measured pages or more |
| Pages feel quick on a phone | p75 LCP under 2.5 s, INP under 200 ms, CLS under 0.1 | The Console's "Số liệu" (p75 of the last 7 days from `web_signals`); PostHog's "Web Vitals p75 theo kind" insight (`scripts/posthog-insights.ts` makes the four insights with the owner's personal key) |

Before a release the browser checks hold the same line in the lab: `e2e/next/perf.spec.ts` keeps every listed screen at CLS 0.05 at most on a throttled phone, within its JS budget.

## When an objective is missed

1. Roll back first: promote the last good `feestfinder-web` deployment in Vercel (Instant Rollback); the API's previous production deployment the same way. Migrations only add, so the previous API runs on the newer database.
2. Write the incident below: one line, the day, what people saw, for how long, the cause.
3. Add the test that would have caught it (`festfinder-backend/test/*.test.ts` for the API, `e2e/next/*.spec.ts` for a screen), then fix forward.

## Pull requests

- CI (`ci.yml`) should answer within 8 minutes: the browser checks run in three shards, each on its own build and database. On 2026-10-18 it took about 9: the second shard (the every-screen checks: health, layout, performance) runs 7½ minutes while the first runs 2; balancing them is next.
- The lint budgets (`--max-warnings` of the API's oxlint, the web's ESLint) go down with every phase; most of the API's are `any` on untyped SQL rows. The plan: name the row types and share zod schemas as the contract, so the web gets a typed client instead of `FF.get` returning `any` (`docs/TECH_DEBT.md`, item 22).

## Incidents

| Day | What people saw | How long | Cause | Test |
| --- | --- | --- | --- | --- |
