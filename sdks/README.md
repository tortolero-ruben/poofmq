# poofMQ SDKs

Multi-language client SDKs for the poofMQ API. Each subdirectory contains the SDK for one language.

## Layout

| Directory | Language | Status |
|-----------|----------|--------|
| `node/`   | Node.js / TypeScript | MVP (RUB-263) |
| `python/` | Python 3             | MVP (RUB-266) |
| `go/`     | Go                  | Generated stubs |
| `java/`   | Java                | Generated stubs |

## Regenerating SDKs

From the repository root:

```bash
make generate-artifacts   # ensure OpenAPI is up to date
make sdk-generate        # regenerate all SDK outputs from dist/openapi/v1/poofmq.json
```

See [docs/sdk-versioning.md](../docs/sdk-versioning.md) for versioning and release process.

## Installing SDKs

- **Node:** `cd sdks/node && npm install && npm run build`. Requires `make sdk-generate` first so `generated/` exists.
- **Python:** From repo root run `make sdk-generate`, then `cd sdks/python && pip install ./generated && pip install -e .`. Run unit tests with `pytest test/`.
