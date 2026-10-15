---
name: feestfinder-ship
description: Check, commit, merge and deploy FeestFinder to production (Vercel). Use only when the person asks to commit, push, merge or deploy.
---

# Shipping

Commit, push or deploy only when the person asks. A push to `main` deploys production on both Vercel projects (`feestfinder` = the API, `feestfinder-web` = feestfinder.com); migrations run when the API boots.

1. Checks, from `festfinder-backend/`:
   ```bash
   npm run typecheck
   npm test
   npm run test:screens
   ```
   and `npx tsc --noEmit -p .` in `festfinder-web/`. All must pass; say so with the counts.
2. Work on a branch; commit with the repo's author when git has none configured: `git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit` and the `Co-Authored-By` line. Update `docs/FEESTFINDER_ROADMAP.md` (and `CLAUDE.md` when a rule changes) in the same change.
3. Push the branch, then fast-forward `main` to it and push `main` (fetch first: never overwrite someone else's commits).
4. Watch both deployments until `Ready` (`vercel ls --environment production` in a folder linked to each project, or the Vercel MCP), then check feestfinder.com itself: a page, `/map/style.json`, `/sitemap.xml`, and what the change touched.
5. Environment variables (`MAP_*`, secrets) are set in Vercel; a change needs a redeploy to apply. Secrets are entered by the person, never written to the repo.
6. To undo a bad web release, promote an earlier `feestfinder-web` deployment in Vercel (Instant Rollback).
