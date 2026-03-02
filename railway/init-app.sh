#!/usr/bin/env bash
set -e

# When DB_URL is set (e.g. ${{Postgres.DATABASE_URL}}), Railway deploys Postgres first.
# Wait for DB to be reachable so pre-deploy migrate doesn't fail on first or concurrent deploys.
if [ -n "${DB_URL:-}" ]; then
  echo "Waiting for database..."
  for i in $(seq 1 30); do
    if php artisan db:show --database=pgsql >/dev/null 2>&1; then
      echo "Database is ready."
      break
    fi
    if [ "$i" -eq 30 ]; then
      echo "Database did not become ready in time."
      exit 1
    fi
    sleep 2
  done
fi

php artisan migrate --force
