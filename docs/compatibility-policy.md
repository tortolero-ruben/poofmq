# Compatibility Policy

This document describes supported runtimes, API contract compatibility, and how compatibility is enforced in CI.

## Supported runtimes

| Component | Version | Notes |
|-----------|--------|--------|
| PHP (Laravel portal) | 8.4 | See `composer.json` / CLAUDE.md |
| Node (frontend, Node SDK) | 22 (LTS) | See `.nvmrc` or CI |
| Go (API service) | From `services/go-api/go.mod` | CI uses `go-version-file` |
| Python (Python SDK) | 3.9+ | See `sdks/python/pyproject.toml` |

## API contract

- **OpenAPI:** Single source of truth is the generated spec. Version is set in `config/openapi-version.txt` and injected into `dist/openapi/v1/poofmq.json`.
- **Breaking changes:** Must be called out in release notes (see `docs/release-notes-api-template.md`) and approved before release.
- **SDKs:** Generated from the published OpenAPI artifact using a pinned OpenAPI Generator image (`openapitools/openapi-generator-cli:v7.10.0` by default in `scripts/sdk-generate.sh`). Regenerate with `make sdk-generate` after contract or version changes.

## CI enforcement

Compatibility is enforced by the following CI jobs (see `.github/workflows/ci.yml`):

- **generated-artifacts** – Ensures proto/OpenAPI generation is deterministic and committed artifacts are up to date.
- **sdk-generate** – Ensures SDK generation from the OpenAPI spec succeeds for all target languages.
- **sdk-node-build** – Ensures the Node SDK (generated client + wrapper) builds successfully.
- **sdk-python-tests** – Ensures the Python SDK installs and unit tests pass.
- **laravel-lint / laravel-tests** – PHP/Laravel code quality and tests.
- **go-lint / go-unit-tests / go-integration-tests** – Go code quality and tests.

Before cutting a release, ensure all NFR and compatibility gates pass and use the release notes template for contract changes.
