#!/usr/bin/env bash
set -e
# When DB_URL is not set, Laravel defaults to sqlite; ensure the file exists so
# Railpack's startup (config:cache, cache:clear) and healthcheck /up can succeed.
if [ -z "${DB_URL}" ]; then
  mkdir -p database
  touch database/database.sqlite
fi
php artisan migrate --force
