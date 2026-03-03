#!/usr/bin/env bash
# Add Redis (and optionally Postgres) to the current Railway project via CLI.
# Run from repo root with the project already linked: railway link
# Usage: ./railway/add-redis.sh [--postgres]
set -e

if ! command -v railway >/dev/null 2>&1; then
  echo "Railway CLI is required. Install: https://docs.railway.com/guides/cli"
  exit 1
fi

if ! railway whoami >/dev/null 2>&1; then
  echo "Not logged in. Run: railway login"
  exit 1
fi

# Ensure we're in project root (railway link is from repo root)
if [ ! -f "railway/init-app.sh" ]; then
  echo "Run this script from the repository root."
  exit 1
fi

ADD_POSTGRES=false
for arg in "$@"; do
  if [ "$arg" = "--postgres" ]; then
    ADD_POSTGRES=true
    break
  fi
done

echo "Adding Redis to the linked Railway project..."
railway add --database redis

if [ "$ADD_POSTGRES" = true ]; then
  echo "Adding Postgres to the linked Railway project..."
  railway add --database postgres
fi

echo ""
echo "Done. Redis (and Postgres if requested) have been added and are deploying."
echo "Next steps:"
echo "  1. In Railway dashboard, open your Laravel app service → Variables."
echo "  2. Add DB_URL = \${{Postgres.DATABASE_URL}} and Redis vars from the Redis service"
echo "     (e.g. REDIS_URL or REDIS_HOST / REDIS_PORT / REDIS_PASSWORD)."
echo "  3. If you deploy from this repo, re-link to your app service: railway link"
echo "     (select the Laravel app service so 'railway up' deploys the app, not Redis)."
