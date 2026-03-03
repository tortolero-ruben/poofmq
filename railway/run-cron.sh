#!/usr/bin/env bash
set -e
exec php artisan schedule:work
