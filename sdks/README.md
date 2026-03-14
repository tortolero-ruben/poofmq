# poofMQ SDKs

Multi-language client SDKs for the poofMQ API. Each subdirectory contains the SDK for one language.

## Layout

| Directory | Language             | Status          |
| --------- | -------------------- | --------------- |
| `node/`   | Node.js / TypeScript | MVP (RUB-263)   |
| `python/` | Python 3             | MVP (RUB-266)   |
| `go/`     | Go                   | Generated stubs |
| `java/`   | Java                 | Generated stubs |

## Regenerating SDKs

From the repository root:

```bash
make generate-artifacts   # ensure OpenAPI is up to date
make sdk-generate        # regenerate all SDK outputs from dist/openapi/v1/poofmq.json
```

See [docs/sdk-versioning.md](../docs/sdk-versioning.md) for versioning and release process.

## Installing SDKs

- **Node:** `npm install @poofmq/node`
- **Python:** `pip install poofmq`

Use [docs/quickstart.md](../docs/quickstart.md) first to get a queue ID and the correct API base URL. In SDK examples, `POOFMQ_BASE_URL` should point to the poofMQ API origin, not the portal origin.
