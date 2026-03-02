# SDK Versioning Strategy

poofMQ SDKs follow a single versioning strategy aligned with the API contract.

## Version source of truth

- **API version:** `config/openapi-version.txt` (e.g. `1.0.0`). This value is injected into the OpenAPI artifact and published to `dist/openapi/v1/poofmq.json`.
- **SDK versions:** Each language SDK should expose the same version as the API version it was generated from or is compatible with. When publishing SDK packages (e.g. to npm, PyPI), use the same version as `config/openapi-version.txt` unless maintaining a separate SDK release line (then document the mapping).

## Regeneration

1. Bump or set the version in `config/openapi-version.txt` when releasing a new API contract.
2. Run `make generate-artifacts` to regenerate OpenAPI and publish to `dist/openapi/v1/`.
3. Run `make sdk-generate` to regenerate all language SDK stubs from the published OpenAPI spec.
4. Update hand-written SDK code (Node, Python, etc.) if the contract changed, and run tests.

## Additive vs breaking changes

- **Additive:** New optional fields, new endpoints, new enum values. No SDK major version bump; patch/minor as appropriate.
- **Breaking:** Removed or renamed fields, changed types, removed endpoints. Bump API version (e.g. to 2.0.0) and document in `docs/release-notes-api-template.md`. Regenerate all SDKs and release new major versions.

## CI

- `make generate-artifacts` and `make ci-check-generated` ensure OpenAPI and published artifacts are up to date.
- `make sdk-generate` is run in CI to verify that SDK generation succeeds for all target languages from a clean environment.
