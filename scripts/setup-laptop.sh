#!/usr/bin/env bash
# A new machine, ready to work on FeestFinder (docs/handoff/NEW_LAPTOP.md):
#
#   bash scripts/setup-laptop.sh
#
# Checks the tools, installs both packages and the browser the screen checks use, clones the
# design kit next to this repo when it is missing (its MCP server is in .mcp.json), copies the
# agent's memory into place, and runs one quick test. It changes nothing outside this repo, the
# design kit beside it and Claude's memory folder for this project, and never touches a secret.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KIT="$(dirname "$ROOT")/design-kit"
ok() { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
say() { printf '\n\033[1m%s\033[0m\n' "$*"; }

say "1/6 Tools"
command -v node >/dev/null || { echo "Node.js 24 is needed (nvm install 24): https://nodejs.org" >&2; exit 1; }
node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 24 ? 0 : 1)' || { echo "Node.js 24 is needed (this is $(node -v)): nvm install 24 && nvm use 24" >&2; exit 1; }
ok "node $(node -v)"
command -v python3 >/dev/null && ok "$(python3 --version) (the blog skill's scripts)" || warn "python3 is missing: the blog skill's scripts (yt.py, commons.py, check_urls.py) need it"
command -v git >/dev/null && ok "$(git --version)" || { echo "git is needed" >&2; exit 1; }
command -v gh >/dev/null && { gh auth status >/dev/null 2>&1 && ok "gh signed in" || warn "gh is not signed in: gh auth login"; } || warn "gh is missing (pull requests, CI): https://cli.github.com"
command -v vercel >/dev/null && ok "vercel CLI $(vercel --version 2>/dev/null | tail -1)" || warn "vercel CLI is missing (optional: logs, deployments): npm i -g vercel"

say "2/6 Packages"
(cd "$ROOT/festfinder-backend" && npm install --no-audit --no-fund --loglevel=error) && ok "festfinder-backend"
(cd "$ROOT/festfinder-web" && npm install --no-audit --no-fund --loglevel=error) && ok "festfinder-web"

say "3/6 The screen checks' browser"
(cd "$ROOT/festfinder-backend" && npx playwright install chromium >/dev/null) && ok "Playwright Chromium"

say "4/6 The design kit beside this repo (MCP server design-kit: blog_check, design rules)"
if [ ! -d "$KIT/.git" ]; then
  git clone -q git@github.com:kitsbui/design-kit.git "$KIT" && ok "cloned to $KIT" || warn "could not clone kitsbui/design-kit (SSH key?): clone it to $KIT by hand"
else
  (cd "$KIT" && git pull -q --ff-only) && ok "up to date at $KIT" || warn "$KIT has local changes: pull it by hand"
fi
if [ -d "$KIT/mcp" ]; then
  (cd "$KIT/mcp" && npm install --no-audit --no-fund --loglevel=error) && ok "design-kit MCP installed"
fi

say "5/6 The agent's memory for this project"
# Claude Code keeps a project's memory under ~/.claude/projects/<the repo's path, each character that is not a letter or digit turned into ->/memory.
MEM="$HOME/.claude/projects/$(printf '%s' "$ROOT" | sed 's#[^A-Za-z0-9]#-#g')/memory"
if [ -f "$MEM/MEMORY.md" ]; then
  ok "already there: $MEM (left as it is)"
else
  mkdir -p "$MEM" && cp "$ROOT"/docs/handoff/claude-memory/*.md "$MEM"/ && ok "copied to $MEM"
fi

say "6/6 A quick check"
(cd "$ROOT/festfinder-backend" && node --test test/blog-content.test.ts >/dev/null 2>&1) && ok "test/blog-content.test.ts passes" || warn "test/blog-content.test.ts failed: run it to see why"
for v in SUPABASE_PROJECT_REF SUPABASE_ACCESS_TOKEN; do
  [ -n "${!v:-}" ] && ok "$v is set" || warn "$v is not set: the Supabase MCP server (read-only, staging) needs it (docs/handoff/NEW_LAPTOP.md, step 4)"
done

say "Done. Open the repo in the Claude desktop app (Code tab); approve the MCP servers when asked, and sign in to Vercel's with OAuth."
