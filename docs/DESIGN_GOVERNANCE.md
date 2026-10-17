# Design governance

Design v2 phase 6 ("QA và quản trị", continuous). The design review canvas (artboard 21, "Lộ trình lên 9 điểm") defines a 9 for each criterion as three columns that are all green: the automatic checks on every pull request, five real people at every major phase, and the numbers read every two weeks. No column stands in for another.

## 1. On every pull request (automatic)

| Gate | Where | Fails when |
| --- | --- | --- |
| Types and lint | `ci.yml` (API, Web) | a type error; an ESLint or oxlint warning over its budget; a hex colour outside `theme.css`, an old token name, or more arbitrary `[Npx]` values than `PX_BUDGET` (`festfinder-web/scripts/check-tokens.ts`). Budgets only go down. |
| Layout | `e2e/next/layout.spec.ts` | any screen of any role scrolls sideways at 390, 768 or 1440px |
| Accessibility | `e2e/next/wcag.spec.ts` | axe finds a serious or critical WCAG 2.1 AA violation on any screen of any role at 390 or 1440px |
| Touch targets | `e2e/next/targets.spec.ts` | anything one taps on a phone (390px, touch) is under 44 × 44px |
| Flows | the rest of `e2e/next/` | a flow breaks |
| Screens | `visual.yml` | the main screens look different from the base branch's and nobody accepted it |
| Checklist | `design-checklist.yml` | a PR that touches `festfinder-web` or `festfinder-frontend` has an unticked box in its "Thiết kế" checklist |

The last two run only on pull requests. To make them, and CI, a condition of merging, the owner protects `main` on GitHub (Settings → Branches: require a pull request and the checks `Design checklist`, `Visual (PR vs base)`, `Screens (next)`, `Web (Next.js)` and the two `API` jobs); until then the ship skill (`.claude/skills/feestfinder-ship`) sends every change to the front through a pull request.

### Screens: accepting a visual change

`visual.yml` shoots the screens of `e2e/next/visual.spec.ts` (the home page by day and as a table, the event page, the artists, the kit; at 390, 768 and 1440px) on the base branch and on the pull request, on the same runner, and compares them. When they differ the check fails and the `visual-diff` artifact holds the expected, actual and diff images (and Playwright's HTML report). Look at them; if the change is the one intended, add the label `visual-ok` to the pull request. A new push takes the label off, so an approval is always of the latest screens. Pull requests that change nothing under `festfinder-web` or `festfinder-frontend` skip the comparison.

The baselines committed next to `visual.spec.ts` are for local runs only (`npm run test:visual`, from a fresh build; never with `WEB_SKIP_BUILD`).

### Touch targets

`targets.spec.ts` measures every link, button, field, tab, switch and menu item on every screen of `routes.ts` at 390px with a touch screen. A target counts its own box and the hit area its `::before` or `::after` draws around it, minus whatever an ancestor clips. WCAG's exceptions apply: a link inside a sentence, a link with an equivalent of 44px or more to the same address (a card's title beside its picture), a control inside its label.

To fix one, prefer the part's own size (`kd-btn`, `kd-chip`, `kd-tab`, fields and segments are already 44px). Otherwise:

- `kd-hit` on a line of text one taps (a row's title, a crumb, a link in a list): 44px tall without moving the lines around it. Put it on the element that carries `kd-ell`, never inside a box that clips.
- `kd-tap` on a small fixed-size control (an avatar button): a 44px hit area around it.

### The checklist

The pull request template (`.github/pull_request_template.md`) carries it; `.github/scripts/design-checklist.mjs` reads it. Tick "Không đổi giao diện" when the change shows nothing new; otherwise tick every box:

1. One primary action per screen (`tone: 'acc'`, `glow` on the one that leads the page); colours by role, no hex outside `theme.css`.
2. Fits 390 / 768 / 1440 without sideways scroll; tables fold into cards under 640px.
3. Lean copy: titles and actions, no explaining lines; both `vi` and `en`.
4. Three states: loading, empty (with something to do), error (with retry).
5. Accessibility: accessible names start with the visible words, targets of 44px or more, visible focus, sheets give focus back.
6. A new screen is listed in `e2e/next/routes.ts`, so layout, axe and targets check it.
7. Screens: no visual change, or the `visual-diff` seen and `visual-ok` added.

## 2. Five people at every major phase

After each major phase reaches production (or a preview of it), five target users try it, moderated, one at a time, about 30 minutes each, on their own phone unless the task is a back office.

| Who | Main task (no hints) | Second task |
| --- | --- | --- |
| 2 people who go out | Find a techno night this weekend in their city and reach the ticket button | Save a night, then find it again from "Đã lưu" |
| 2 organisers | Post an event from "Đăng sự kiện" to "Gửi duyệt", signing in when asked | From "Hôm nay", do the first thing on the to-do list |
| 1 artist | Find their name and claim it ("Đây là tôi") | Add a mix to their profile |

Pass: at least 4 of 5 finish the main task without a hint, and on a phone the first event is on screen within 10 seconds of opening the site (stopwatch, cold start). For each person write down: finished (yes / with a hint / no), the time, where they hesitated, and anything they said twice. Keep the table in the roadmap's log under the phase, and fix every place two people hesitated before the next phase starts.

## 3. The numbers, every two weeks

A 30-minute review every second week. Read the same numbers each time, against the period before; nothing may fall two periods in a row. When one does, write down why and what changes, and tell the owner.

| Number | Where | Read as |
| --- | --- | --- |
| List → event → ticket | PostHog funnel: `page_view` (path `/`) → `card_open` → `event_view` → `ticket_click`, per person, within a day | each step's conversion; the canvas's goal is +15% after four weeks |
| Ways in | PostHog: `nav_click` broken down by `kind` and `surface` | no destination at zero (Dự án was the worry) |
| Draft → submit | PostHog: `wizard_step` with `kind` `basics` → `submitted`, broken down by `role` (`guest`, `organizer`) | the share that sends; where people stop (`when`, `tickets`, `review`, `signin`) |
| Review time | Console → Số liệu: "Đã duyệt" (median minutes from submission to decision) and the promise kept (`withinPromise`, 7 days against the 7 before) | going down |
| Claims | PostHog: `role_picker_shown` (`surface`) → server `profile_claimed`; Console → Yêu cầu nhận | more profiles claimed |
| First event on a phone | the five-person test's stopwatch; `e2e/next/pages.spec.ts` checks it is in the first screen | under 10 seconds |

PostHog receives events only where `POSTHOG_KEY` is set (`services/analytics.ts`); names and properties are the fixed lists there, never an email, a name or an IP.

## When a gate is wrong

A gate that blocks a good change is fixed in the same pull request, with the reason in its description: a new exception in `targets.spec.ts` names the WCAG rule it follows; a budget never goes up.
