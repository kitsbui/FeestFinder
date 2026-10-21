---
name: design-kit-repo
description: "Local repo /home/patrickstar/Desktop/design-kit made 2026-10-19 at the owner's request: the FeestFinder redesign retrospective, a reusable design system, the Playwright gates, five Claude Code skills and an MCP server, for future projects"
metadata:
  node_type: memory
  type: reference
  originSessionId: 2eec4d50-7c04-4004-9062-f257ace903ab
  modified: 2026-10-19T03:16:22.740Z
---

`/home/patrickstar/Desktop/design-kit`, pushed on the owner's yes (2026-10-19) to the private repo https://github.com/kitsbui/design-kit (branch `main`) holds what the FeestFinder design v2 taught, packaged for the next project:

- `LEARNINGS.md`: the retrospective in Vietnamese (timeline 06–19.10, reasoning right/wrong, process, 18 errors table, style and layout, 12 lessons, a 6-day process).
- `design-system/`: `tokens.json` → `scripts/build-tokens.mjs` → `tokens.css` (Tailwind v4 @theme) and `tokens.vanilla.css`; `parts.md`, `layout.md`, `copy.md`, `ai-smells.md` (16 patterns), `rubric.md` (7 criteria, 9/9.5/10, newcomer metrics, pick the colour once), `checklist.md`.
- `gates/`: layout, wcag, targets, perf, first-screen, visual specs behind `setup.ts` (ACCOUNTS, ROUTES, SCREENS, signIn, ready, resolve); `check-tokens.ts`; `github/` visual.yml + design-checklist.yml/.mjs + PR template.
- `skills/`: design-review, design-system-setup, design-gates, design-phase, newcomer-flow.
- `mcp/src/server.ts`: stdio MCP (`@modelcontextprotocol/sdk` 1.32, zod 3) with design_principles, design_tokens, design_parts, design_layout, design_copy, design_checklist, design_rubric, learnings, measure_first_screen (Playwright is in optionalDependencies and Chromium was installed with `npx playwright install chromium`; `DESIGN_KIT_PLAYWRIGHT` can point at another project's copy), scaffold. `npm test` runs `test/smoke.mjs`.
- `templates/`: CLAUDE.design.md, DESIGN_GOVERNANCE.md, artboard.html.
- Added 2026-10-20 (owner: "cập nhật kỹ năng thiết kế, trình bày vào mcp skill… tạo thêm skill viết blog"): `design-system/patterns.md` (one column, music-service profile, waveform playlist, centred article, flag switch, immersive phone, budgets), LEARNINGS §9, skills `page-patterns` and `blog-writing`, `blog-kit/` (writing, presentation, seo-aio, research, template, scripts), MCP 0.2.0 with `design_patterns`, `blog_guide`, `blog_template`, `blog_check` (scores a post; FeestFinder's own pack fails it on excerpt length, Wikipedia-only sources, short FAQ answers), `blog_jsonld`. Commit dc9f902 on main.

**Why:** the owner asked (2026-10-19) for a repo with an MCP, design skills, a design system and key learnings "để rút kinh nghiệm và rút ngắn thời gian" for coming projects.

**How to apply:** when the owner starts another project, copy `skills/*` into its `.claude/skills/`, add the MCP to `.mcp.json` (`mcp/.mcp.example.json`), and follow `README.md`'s ten-minute start; update `LEARNINGS.md` with new lessons rather than writing a second retrospective. See [[design-review-canvas-2026-10]] for the FeestFinder specifics.
