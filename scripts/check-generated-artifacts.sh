#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "${PROJECT_ROOT}"

if ! command -v docker >/dev/null 2>&1; then
    echo "error: docker is required for generated artifact checks."
    exit 1
fi

make proto-check-generated

echo "generated artifacts are up to date."
