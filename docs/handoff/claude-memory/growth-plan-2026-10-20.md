---
name: growth-plan-2026-10-20
description: Growth plan v3 (no ticket sales, Gmail comments, affiliate, badges, PWA) shipped to production 2026-10-20; what is left and the Vercel/PostHog setup
metadata:
  type: project
---
Growth plan v3 (docs/HANDOFF_2026-10-19_growth-plan.md, meeting docs/MEETING_2026-10-20_final-plan.md) shipped to production on 2026-10-20: PR kitsbui/FeestFinder#28 (cards C, A, B, 4, D, 5, 6, 1, E, F; migrations 051–057) and #29 (PostHog Logs, `services/remote-logs.ts`).

PostHog project is on **US Cloud**: the API project `feestfinder` has POSTHOG_KEY, POSTHOG_HOST=https://us.i.posthog.com, POSTHOG_LOGS=1. A stray POSTHOG_KEY sits on `feestfinder-web` (unused). The owner first put the key on the web project by mistake — only the API reads it.

Vercel CLI is installed on the owner's machine and logged in (buingockieuanhwork-2826); link a scratch folder (`vercel link --yes --project feestfinder`) and delete the `.env.local` it writes.

**Why:** later sessions need to know these cards are done and what was deliberately left.
**How to apply:** the code leftovers (badge story art, calendar edits to review, clicks by seller, story chunk for the JS budget) are in PR kitsbui/FeestFinder#30 (2026-10-20). Owner tasks (confirm no paid prod orders, affiliate partner deal, real-phone install test, five-person tests, PostHog baseline funnel). Never paste a phc key into the repo; never type API keys for the owner. See [[design-review-canvas-2026-10]].
