# API Contract Release Notes

Use this template when publishing a new API/OpenAPI version or when contract changes are released. Copy the relevant section and fill in the details.

## Version: [e.g. 1.1.0]

**Release date:** YYYY-MM-DD

### Summary

Brief description of what changed in this release.

### Contract changes

- [ ] **Breaking:** List any breaking changes (removed/renamed fields, changed types, removed endpoints).
- [ ] **Additive:** List new optional fields, new endpoints, or new enum values that are backward-compatible.
- [ ] **Behavioral:** List any changes to semantics or error responses that consumers must account for.

### Migration notes

Steps or guidance for consumers upgrading from the previous version.

### OpenAPI / SDK impact

- OpenAPI artifact: `dist/openapi/v1/poofmq.json` (or versioned path).
- Regenerate SDKs after pulling: `make generate-artifacts` (and any SDK-generation targets).

### Checklist before release

- [ ] All NFR and compatibility gates passed.
- [ ] Breaking changes explicitly called out and approved.
- [ ] Version bumped in `config/openapi-version.txt` if releasing a new API version.
