#!/usr/bin/env bash
#
# Injects API version and title into the generated OpenAPI (Swagger) JSON
# so that artifacts are deterministic and versioned for SDK/tooling consumption.
# Uses Python for portability (no jq required in CI).
#
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPENAPI_JSON="${PROJECT_ROOT}/gen/openapi/poofmq.swagger.json"
VERSION_FILE="${PROJECT_ROOT}/config/openapi-version.txt"

if [[ ! -f "${VERSION_FILE}" ]]; then
  echo "error: version file not found: ${VERSION_FILE}" >&2
  exit 1
fi

if [[ ! -f "${OPENAPI_JSON}" ]]; then
  echo "error: generated OpenAPI file not found: ${OPENAPI_JSON}" >&2
  exit 1
fi

VERSION=$(cat "${VERSION_FILE}" | tr -d '[:space:]')
if [[ -z "${VERSION}" ]]; then
  echo "error: empty version in ${VERSION_FILE}" >&2
  exit 1
fi

export OPENAPI_JSON
export OPENAPI_VERSION="${VERSION}"
python3 << 'PYTHON'
import json
import os
path = os.environ['OPENAPI_JSON']
version = os.environ['OPENAPI_VERSION']
with open(path) as f:
    d = json.load(f)
d['info']['version'] = version
d['info']['title'] = 'poofMQ API'
with open(path, 'w') as f:
    json.dump(d, f, indent=2)
    f.write('\n')
PYTHON

echo "Injected OpenAPI version: ${VERSION}"
