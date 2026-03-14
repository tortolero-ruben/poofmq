# Documentation

Repository-tracked documentation lives in this directory.

## Start Here

- [quickstart.md](quickstart.md) - product and API getting-started guide for queue creation, auth, HTTP usage, and SDK usage.
- [compatibility-policy.md](compatibility-policy.md) - supported runtimes and contract compatibility guarantees.
- [sdk-versioning.md](sdk-versioning.md) - API and SDK release/versioning rules.
- [openapi-sdk-verification.md](openapi-sdk-verification.md) - generated OpenAPI and SDK verification notes.
- [release-notes-api-template.md](release-notes-api-template.md) - template for documenting contract changes.

## Structure

- `adr/` - Architecture Decision Records (ADRs) and ADR process notes.
- `plans/` - dated implementation notes and design plans that are still useful as project history.

## Why in-repo

- Decisions and implementation evolve together in pull requests.
- Engineers and agents can reliably use the same versioned context.
- Downstream tasks can reference stable file paths and constants.
