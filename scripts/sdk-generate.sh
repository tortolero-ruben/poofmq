#!/usr/bin/env bash
#
# Regenerates SDK client stubs for all target languages from the published
# OpenAPI spec (dist/openapi/v1/poofmq.json). Requires Docker.
#
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPEC="${PROJECT_ROOT}/dist/openapi/v1/poofmq.json"
OPENAPI_GENERATOR_IMAGE="${OPENAPI_GENERATOR_IMAGE:-openapitools/openapi-generator-cli:v7.10.0}"

if [[ ! -f "${SPEC}" ]]; then
  echo "error: OpenAPI spec not found. Run 'make generate-artifacts' first: ${SPEC}" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "error: docker is required to run OpenAPI Generator." >&2
  exit 1
fi

run_generate() {
  local generator=$1
  local output_dir=$2
  local extra_opts="${3:-}"
  echo "Generating ${generator} -> ${output_dir}..."
  mkdir -p "${output_dir}"
  docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "${PROJECT_ROOT}:/local" \
    -w /local \
    "${OPENAPI_GENERATOR_IMAGE}" \
    generate \
    -i "/local/dist/openapi/v1/poofmq.json" \
    -g "${generator}" \
    -o "/local/${output_dir}" \
    ${extra_opts}
}

cd "${PROJECT_ROOT}"

# TypeScript/Node: use importFileExtension=.js so generated code works with Node ESM (NodeNext)
run_generate "typescript-fetch" "sdks/node/generated" "--additional-properties=importFileExtension=.js"

# Python
# Keep enum member names concise (e.g. UNSPECIFIED) so generated model defaults resolve correctly.
run_generate "python" "sdks/python/generated" "--additional-properties=removeEnumValuePrefix=true"

# OpenAPI Generator v7.10.0 emits V1EncryptionMode.UNSPECIFIED in one model file
# while the generated enum defines ENCRYPTION_MODE_UNSPECIFIED. Normalize this
# known mismatch so generated Python package imports cleanly in CI/local runs.
python3 <<'PYTHON'
from pathlib import Path

path = Path("sdks/python/generated/openapi_client/models/v1_payload_envelope.py")
if path.is_file():
    content = path.read_text()
    normalized = content.replace(
        "V1EncryptionMode.UNSPECIFIED",
        "V1EncryptionMode.ENCRYPTION_MODE_UNSPECIFIED",
    )
    if normalized != content:
        path.write_text(normalized)
PYTHON

# Go
run_generate "go" "sdks/go/generated"

# Java
run_generate "java" "sdks/java/generated"

echo "SDK generation complete for all languages."
