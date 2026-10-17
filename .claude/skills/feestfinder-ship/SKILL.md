---
name: feestfinder-ship
description: Check, commit, merge and deploy FeestFinder to production (Vercel). Use only when the person asks to commit, push, merge or deploy.
---

# Shipping

Commit, push or deploy only when the person asks. A push to `main` deploys production on both Vercel projects (`feestfinder` = the API, `feestfinder-web` = feestfinder.com); migrations run when the API boots.

1. Checks, from `festfinder-backend/`:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run test:screens
   ```
   and `npx tsc --noEmit -p .` and `npm run lint` in `festfinder-web/`. All must pass; say so with the counts. `test:screens` includes layout, axe and the 44px touch targets on every role's screens.
2. Work on a branch; commit with the repo's author when git has none configured: `git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit` and the `Co-Authored-By` line. Update `docs/FEESTFINDER_ROADMAP.md` (and `CLAUDE.md` when a rule changes) in the same change.
3. Push the branch. When the change touches `festfinder-web` or `festfinder-frontend`, open a pull request (`gh pr create`, the body from `.github/pull_request_template.md` with the "Thiết kế" checklist ticked truthfully) and wait for its checks: `Design checklist`, and `Visual`, whose `visual-diff` artifact the person looks at before adding the label `visual-ok` (never add it yourself). Then fast-forward `main` to the branch and push `main` (fetch first: never overwrite someone else's commits). `docs/DESIGN_GOVERNANCE.md` has the gates.
4. Watch both deployments until `Ready` (`vercel ls --environment production` in a folder linked to each project, or the Vercel MCP), then check feestfinder.com itself: a page, `/map/style.json`, `/sitemap.xml`, and what the change touched.
5. Environment variables (`MAP_*`, secrets) are set in Vercel; a change needs a redeploy to apply. Secrets are entered by the person, never written to the repo.
6. To undo a bad web release, promote an earlier `feestfinder-web` deployment in Vercel (Instant Rollback).
