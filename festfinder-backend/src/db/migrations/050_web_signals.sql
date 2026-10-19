-- Web signals (design v2 phase 19, 2026-10-19): what the browsers report, kept 30 days so the
-- Console's numbers read real Web Vitals and the browser-error rate without a PostHog or Sentry
-- key. One row per report: a vital (LCP, INP, CLS with its value and rating) or an uncaught
-- error. Paths only, never a query string, never who.
create table web_signals (
  id      bigserial primary key,
  at      timestamptz not null default now(),
  kind    text not null check (kind in ('vital', 'error')),
  name    text not null,
  value   double precision,
  rating  text check (rating in ('good', 'needs-improvement', 'poor')),
  path    text
);
create index web_signals_at on web_signals (at);
create index web_signals_kind_name_at on web_signals (kind, name, at);
