#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "${PROJECT_ROOT}"

make proto-generate
"${PROJECT_ROOT}/scripts/inject-openapi-version.sh"
make openapi-publish
