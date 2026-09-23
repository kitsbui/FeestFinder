#!/usr/bin/env bash
#
# Nightly backup of the FeestFinder database.
#
#   ./scripts/backup.sh                     # writes ./backups/festfinder-<stamp>.dump
#   BACKUP_DIR=/mnt/backups ./scripts/backup.sh
#
# Keeps the last 14 dumps. Run it from cron or a platform scheduler, and copy the dumps
# off this machine — a backup on the same disk as the database is not a backup.
#
# A dump is only worth what a restore proves, so run ./scripts/restore-check.sh against
# the newest dump on a schedule too.
set -euo pipefail

: "${DATABASE_URL:?set DATABASE_URL to the database you want to back up}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP="${KEEP:-14}"

mkdir -p "$BACKUP_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
out="$BACKUP_DIR/festfinder-$stamp.dump"

# -Fc is the custom format: compressed, and pg_restore can read it selectively.
pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-privileges --file="$out"

size="$(du -h "$out" | cut -f1)"
echo "wrote $out ($size)"

# Drop the oldest dumps beyond KEEP.
ls -1t "$BACKUP_DIR"/festfinder-*.dump 2>/dev/null | tail -n "+$((KEEP + 1))" | while read -r old; do
  rm -f "$old"
  echo "removed $old"
done
