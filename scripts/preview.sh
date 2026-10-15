#!/usr/bin/env bash
# One command to preview the whole site on this machine, with the demo data (never Supabase):
#
#   bash scripts/preview.sh
#
# Installs what is missing, starts the API on :4300 on a throwaway embedded database and the
# site on http://localhost:3000, then prints the link and the demo accounts. Ctrl+C stops both.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOGS="$ROOT/.preview"
mkdir -p "$LOGS"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
up() { node -e "fetch(process.argv[1]).then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))" "$1"; }
taken() { node -e "fetch(process.argv[1]).then(() => process.exit(0), () => process.exit(1))" "$1"; }

# Node runs the TypeScript directly: 22.18 or newer (24 in production).
if ! command -v node >/dev/null; then echo "Node.js 24 is needed: https://nodejs.org" >&2; exit 1; fi
if ! node -e 'const [a, b] = process.versions.node.split(".").map(Number); process.exit(a > 22 || (a === 22 && b >= 18) ? 0 : 1)'; then
  echo "Node.js 24 is needed (this is $(node -v))." >&2; exit 1
fi
for port in 4300 3000; do
  if taken "http://localhost:$port/"; then echo "Port $port is already in use: close the other terminal that runs FeestFinder, then try again." >&2; exit 1; fi
done

say "1/3 Installing (the first time takes a minute)…"
(cd "$ROOT/festfinder-backend" && npm install --no-audit --no-fund --loglevel=error)
(cd "$ROOT/festfinder-web" && npm install --no-audit --no-fund --loglevel=error)

PIDS=()
stop() { for p in "${PIDS[@]}"; do kill "$p" 2>/dev/null || true; done; }
trap stop EXIT INT TERM

# The basemap, when festfinder-backend/scripts/build-tiles.sh has cut it into .data/tiles.
TILES="$ROOT/.data/tiles"
if [ -f "$TILES/feestfinder-world.pmtiles" ] && ! taken http://localhost:4400/; then
  node "$ROOT/scripts/tiles-server.ts" "$TILES" 4400 > "$LOGS/tiles.log" 2>&1 &
  PIDS+=($!)
  export MAP_OVERVIEW_URL=http://localhost:4400/feestfinder-world.pmtiles
  [ -f "$TILES/feestfinder-cities.pmtiles" ] && export MAP_TILES_URL=http://localhost:4400/feestfinder-cities.pmtiles
fi

say "2/3 Starting the API with the demo data…"
(
  cd "$ROOT/festfinder-backend"
  export PORT=4300 PUBLIC_BASE_URL=http://localhost:3000 DATABASE_URL= DATABASE_URL_FROM= \
    PGLITE_DIR=./.data/pglite-preview UPLOAD_DIR=./.data/uploads-preview \
    FF_NOW=2026-09-14T10:00:00+07:00 JOBS_ENABLED=false LINK_CHECKS_ENABLED=false SEED_RADAR=1
  node test/fixtures/reset.ts && exec node src/server.ts
) > "$LOGS/api.log" 2>&1 &
PIDS+=($!)
until up http://localhost:4300/health; do
  if ! kill -0 "${PIDS[-1]}" 2>/dev/null; then echo "The API stopped; its log:" >&2; tail -n 30 "$LOGS/api.log" >&2; exit 1; fi
  sleep 1
done

say "3/3 Starting the site…"
(cd "$ROOT/festfinder-web" && FF_API_ORIGIN=http://localhost:4300 exec npm run dev) > "$LOGS/web.log" 2>&1 &
PIDS+=($!)
until up http://localhost:3000/robots.txt; do
  if ! kill -0 "${PIDS[-1]}" 2>/dev/null; then echo "The site stopped; its log:" >&2; tail -n 30 "$LOGS/web.log" >&2; exit 1; fi
  sleep 1
done

cat <<'EOF'

  ✅ Ready: http://localhost:3000

  Team (Console)      http://localhost:3000/console   admin@feestfinder.com / festfinder-admin
  Organiser (Studio)  http://localhost:3000/studio    team@ravolution.vn / ravolution2026
  Fan                 http://localhost:3000           minh@example.com / festfinder123

  Logs are in .preview/. Ctrl+C stops everything.
EOF
command -v xdg-open >/dev/null && xdg-open http://localhost:3000 >/dev/null 2>&1 || true
command -v open >/dev/null && [ "$(uname)" = Darwin ] && open http://localhost:3000 || true
wait
