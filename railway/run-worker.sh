#!/usr/bin/env bash
set -e
exec php artisan queue:work redis --tries=3 --timeout=90
