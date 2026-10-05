#!/usr/bin/env bash
# Cuts the map's basemap out of the latest Protomaps planet build, for the listed cities.
#
#   feestfinder-overview.pmtiles  the region, zoom 0–7 (~17 MB)
#   feestfinder-cities.pmtiles    each listed city's bounds, zoom 0–14 (~165 MB for eight)
#
# Needs the pmtiles CLI (https://github.com/protomaps/go-pmtiles/releases) on PATH. Only the
# needed byte ranges of the planet are downloaded. Upload both files to a bucket that answers
# range requests and allows the site's origin (CORS), then set MAP_OVERVIEW_URL and
# MAP_TILES_URL to their public addresses. Rebuild after adding a city to lib/places.ts.
#
#   bash scripts/build-tiles.sh [out-dir]       (from festfinder-backend/)
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-../.data/tiles}"
mkdir -p "$OUT"
BUILD="$(curl -fsSL https://build-metadata.protomaps.dev/builds.json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const b=JSON.parse(s);console.log(b[b.length-1].key)})')"
echo "planet build: $BUILD"
node -e '
const { launchedCities } = await import("./src/lib/places.ts");
const coordinates = launchedCities().map((c) => { const [w, s, e, n] = c.bbox; return [[[w, s], [e, s], [e, n], [w, n], [w, s]]]; });
process.stdout.write(JSON.stringify({ type: "Feature", properties: {}, geometry: { type: "MultiPolygon", coordinates } }));
' > "$OUT/cities.geojson"
pmtiles extract "https://build.protomaps.com/$BUILD" "$OUT/feestfinder-overview.pmtiles" --bbox=92,-11,146,42 --maxzoom=7
pmtiles extract "https://build.protomaps.com/$BUILD" "$OUT/feestfinder-cities.pmtiles" --region="$OUT/cities.geojson" --maxzoom=14
ls -la "$OUT"/*.pmtiles
