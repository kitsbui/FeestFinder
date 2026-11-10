-- Charts whose read failed (owner, 2026-10-29): a failed read used to wait a whole interval, a
-- day, before the next try, so the YouTube Music charts refused before the key's settings were
-- fixed (the API switched off, the key limited to websites) would stay empty until tomorrow.
-- services/charts.ts now tries a failed chart again within the hour; this sends the ones that
-- failed so far to the next run.

update chart_sources set next_run_at = now() where last_error is not null and enabled;
