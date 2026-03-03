#!/usr/bin/env bash
set -e

# Run migrations with retries to handle DB startup races in Railway pre-deploy.
# We intentionally avoid `php artisan db:show` because it requires the `intl`
# extension in this runtime and can fail even when the database is reachable.
max_attempts=30
for i in $(seq 1 $max_attempts); do
  if php artisan migrate --force; then
    exit 0
  fi

  if [ "$i" -eq $max_attempts ]; then
    echo "Migrations failed after ${max_attempts} attempts."
    exit 1
  fi

  echo "Migration attempt ${i}/${max_attempts} failed, retrying in 2s..."
  sleep 2
done
