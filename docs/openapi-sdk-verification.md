# OpenAPI SDK Generation Verification

This document records how OpenAPI SDK generation is used and that all SDK clients and API routes align with the plan.

## Single source of truth

| Step | Output | Consumed by |
|------|--------|-------------|
| Proto | `proto/poofmq/v1/poofmq.proto` | buf (gRPC + gateway + openapiv2) |
| Buf openapiv2 | `gen/openapi/poofmq.swagger.json` | inject script |
| Version inject | (in place) | `config/openapi-version.txt` |
| Publish | `dist/openapi/v1/poofmq.json` | **All SDK generators** |

- **SDK input:** Every generator in `scripts/sdk-generate.sh` reads **only** `dist/openapi/v1/poofmq.json` (`-i "/local/dist/openapi/v1/poofmq.json"`).
- **API routes in spec:** Exactly two operations, both under `QueueService`:
  - `POST /v1/queues/{queue_id}/messages` — Push
  - `POST /v1/queues/{queue_id}/messages:pop` — Pop

These match the Go gRPC-Gateway routes in `gen/go/poofmq/v1/poofmq.pb.gw.go`. Laravel portal routes (e.g. `api.sandbox.queues.store`) are separate and are not in this spec.

## SDK clients and API routes

### Node.js (`sdks/node`)

- **Generated:** `sdks/node/generated` from `typescript-fetch` generator (with `importFileExtension=.js`).
- **Wrapper:** `sdks/node/src/client.ts` uses **only** generated code:
  - `Configuration`, `QueueServiceApi` from `../generated/`
  - Types: `QueueServicePushBody`, `QueueServicePopBody`, `V1PayloadEnvelope`, `V1PushMessageResponse`, `V1PopMessageResponse`, `V1QueueMessage`, `V1EncryptionMode`
- **API usage:** `this.api.queueServicePush({ queueId, body })` and `this.api.queueServicePop({ queueId, body })` — no hand-rolled URLs or fetch for queue operations.

### Python (`sdks/python`)

- **Generated:** `sdks/python/generated` (package `openapi_client`) from `python` generator.
- **Wrapper:** `sdks/python/poofmq/client.py` uses **only** generated code:
  - `ApiClient`, `Configuration`, `QueueServiceApi` from `openapi_client`
  - Models: `QueueServicePushBody`, `QueueServicePopBody`, `V1PayloadEnvelope`, `V1*` from `openapi_client.models`
- **API usage:** `self._api.queue_service_push(queue_id=..., body=...)` and `self._api.queue_service_pop(queue_id=..., body=...)` — no hand-rolled HTTP for queue operations.

### Go (`sdks/go/generated`)

- **Generated:** From same spec; `api_queue_service.go` implements `QueueServiceAPIService` with `QueueServicePop` and `QueueServicePush` using paths `/v1/queues/{queue_id}/messages:pop` and `/v1/queues/{queue_id}/messages`.
- **Usage:** Generated stubs only; no wrapper package yet. Any future Go client should use this generated API.

### Java (`sdks/java/generated`)

- **Generated:** From same spec; `QueueServiceApi.java` uses the same two paths.
- **Usage:** Generated stubs only; no wrapper package yet. Any future Java client should use this generated API.

## Verification checklist

- [x] Single OpenAPI input for all SDKs: `dist/openapi/v1/poofmq.json`
- [x] Node SDK wrapper uses only generated `QueueServiceApi` and generated types
- [x] Python SDK wrapper uses only generated `QueueServiceApi` and generated types
- [x] Generated Node/Python/Go/Java clients use the same two routes as the spec and the Go gateway
- [x] No application code calls queue Push/Pop via hand-rolled URLs; only generated clients (or wrappers around them) are used for queue API
- [x] Proto contract test asserts gateway paths in proto and OpenAPI version/title in artifact
