#!/usr/bin/env bash
# Set DB and Redis connection variables on Worker and Cron services (same as App).
# Run from repo root with project linked: railway link
# Prerequisite: Create Worker and Cron services in Railway dashboard (see README), then run this script.
set -e

if ! command -v railway >/dev/null 2>&1; then
  echo "Railway CLI required. Install: https://docs.railway.com/guides/cli"
  exit 1
fi

if ! railway whoami >/dev/null 2>&1; then
  echo "Not logged in. Run: railway login"
  exit 1
fi

if [ ! -f "railway/init-app.sh" ]; then
  echo "Run this script from the repository root."
  exit 1
fi

# Variables to set (use single quotes so ${{}} is not expanded by shell)
# NIXPACKS_* force PHP 8.4 build (Worker/Cron often use Nixpacks; app uses Railpack).
VARS=(
  'NIXPACKS_PHP_VERSION=8.4'
  'NIXPACKS_PHP_ROOT_DIR=/app/public'
  'DB_CONNECTION=pgsql'
  'DB_URL=${{Postgres.DATABASE_URL}}'
  'REDIS_URL=${{Redis.REDIS_URL}}'
  'QUEUE_CONNECTION=redis'
  'CACHE_STORE=redis'
  'SESSION_DRIVER=redis'
)

for service in Worker Cron; do
  echo "Setting variables on $service..."
  for var in "${VARS[@]}"; do
    railway variable set -s "$service" "$var" 2>/dev/null || {
      echo "  Failed to set on $service (does the '$service' service exist?). Create it in the Railway dashboard first."
      exit 1
    }
  done
  echo "  Done."
done

echo ""
echo "Worker and Cron now have DB and Redis connection variables."
echo "Ensure APP_KEY, APP_ENV, APP_URL (and any other app vars) are set on these services (or at environment level)."
