#!/usr/bin/env bash
#
# Proves a dump can be restored, which is the only thing that makes it a backup.
#
#   ./scripts/restore-check.sh backups/festfinder-20260918T000000Z.dump
#
# Restores into a throwaway database, counts a few rows, then drops it. Exits non-zero if
# anything is missing, so it can run in cron or CI and page someone when it fails.
set -euo pipefail

dump="${1:?usage: restore-check.sh <dump file>}"
: "${ADMIN_DATABASE_URL:?set ADMIN_DATABASE_URL to a role that may create databases}"
check_db="festfinder_restore_check_$$"

cleanup() {
  psql "$ADMIN_DATABASE_URL" -q -c "drop database if exists $check_db" >/dev/null 2>&1 || true
}
trap cleanup EXIT

psql "$ADMIN_DATABASE_URL" -q -c "create database $check_db"

# The dump carries its own schema, so a plain restore into an empty database is enough.
target="${ADMIN_DATABASE_URL%/*}/$check_db"
pg_restore --dbname="$target" --no-owner --no-privileges "$dump"

read -r users events orders tickets audit <<<"$(psql "$target" -At -F' ' -c "
  select (select count(*) from users),
         (select count(*) from events),
         (select count(*) from orders),
         (select count(*) from tickets),
         (select count(*) from audit_log)")"

echo "restored: $users users, $events events, $orders orders, $tickets tickets, $audit audit entries"

for pair in "users:$users" "events:$events" "audit_log:$audit"; do
  name="${pair%%:*}"; count="${pair##*:}"
  if [ "$count" -lt 1 ]; then
    echo "restore check FAILED: $name is empty" >&2
    exit 1
  fi
done

# The audit log is a hash chain; a torn restore shows up as a broken link.
broken="$(psql "$target" -At -c "select count(*) from audit_log a join audit_log b on b.seq = a.seq - 1 where a.prev_hash <> b.hash")"
if [ "$broken" != "0" ]; then
  echo "restore check FAILED: $broken audit entries do not chain" >&2
  exit 1
fi

echo "restore check passed"
