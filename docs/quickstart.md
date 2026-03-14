# poofMQ Quickstart

poofMQ is a free, simple message queue with a small HTTP API and official SDK documentation for Node and Python.

The documentation model is shared: the concepts stay the same across both SDKs and only the code examples change by language. Supported runtimes: Node 22, Python 3.9+. See [compatibility policy](compatibility-policy.md) for details.

## Table of contents

- [Choose your start path](#choose-your-start-path)
- [Base URLs](#base-urls)
- [Environment variables](#environment-variables)
- [HTTP Quickstart](#http-quickstart)
- [Shared SDK Guide](#shared-sdk-guide)
- [OpenAPI and compatibility](#openapi-and-compatibility)

## Choose your start path

### START INSTANTLY

Use this when you want a queue right now.

1. Open `https://poofmq.com`
2. Click `START INSTANTLY`
3. Complete verification
4. Copy the queue ID
5. Push and pop messages immediately

### GET FREE DEV KEY

Use this when you want reusable credentials for the SDK, projects, and key management.

1. Open `https://poofmq.com`
2. Click `GET FREE DEV KEY`
3. Complete verification
4. Copy the key shown once
5. Send it as `Authorization: Bearer <key>`

## Base URLs

- Portal: `https://poofmq.com`
- Production API: `https://go-api-production-ac36.up.railway.app`
- Local API: `http://localhost:8080`

Use the portal URL to create queues and keys. Use the API URL for `push`, `pop`, and SDK clients.

## Environment variables

```bash
export POOFMQ_BASE_URL="https://go-api-production-ac36.up.railway.app"
export POOFMQ_QUEUE_ID="your-queue-id"
export POOFMQ_API_KEY="your-dev-key"
```

`POOFMQ_API_KEY` is optional. Start without it if you are using the queue you created from `START INSTANTLY`.

`POOFMQ_BASE_URL` should point to the API origin, not `https://poofmq.com`.

## HTTP Quickstart

Use raw HTTP first if you want to verify the API shape before moving into SDK code.

### Authentication

Use authentication only when it helps:

- No API key is required for the queue created from `START INSTANTLY`
- Use a dev key from `GET FREE DEV KEY` when you want reusable credentials
- Send the key as `Authorization: Bearer <key>`
- If you omit the header, requests only work for queues that allow unauthenticated access

Recommendation:

- Use `START INSTANTLY` to prove the flow
- Use `GET FREE DEV KEY` for anything you want to keep using

Common setup mistake:

- `https://poofmq.com` is the portal. Your queue operations should target the API origin in `POOFMQ_BASE_URL`.

Authenticated request example:

```bash
curl -X POST "$POOFMQ_BASE_URL/v1/queues/$POOFMQ_QUEUE_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $POOFMQ_API_KEY" \
  -d '{ "...": "..." }'
```

### Push a message with cURL

```bash
curl -X POST "$POOFMQ_BASE_URL/v1/queues/$POOFMQ_QUEUE_ID/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "envelope": {
      "event_type": "demo.message",
      "payload": {
        "text": "hello from poofmq"
      }
    },
    "ttl_seconds": 300
  }'
```

Expected response:

```json
{
    "message_id": "7a319db4-6d39-4d9d-b5b4-57d3f084b4aa"
}
```

### Pop a message with cURL

```bash
curl -X POST "$POOFMQ_BASE_URL/v1/queues/$POOFMQ_QUEUE_ID/messages:pop" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response:

```json
{
    "message": {
        "message_id": "7a319db4-6d39-4d9d-b5b4-57d3f084b4aa",
        "queue_id": "your-queue-id",
        "envelope": {
            "event_type": "demo.message",
            "payload": {
                "text": "hello from poofmq"
            }
        }
    }
}
```

## Shared SDK Guide

The SDK guide is organized once and rendered for two languages:

- Shared sections: install, auth, push, pop, encryption, error handling, API reference, compatibility
- Language-specific changes: code snippets, install commands, and naming details like `apiKey` vs `api_key`

### Node SDK Quickstart

Install from npm:

```bash
npm install @poofmq/node
```

```ts
import { PoofmqClient } from '@poofmq/node';

const client = new PoofmqClient({
    baseUrl: process.env.POOFMQ_BASE_URL!,
    apiKey: process.env.POOFMQ_API_KEY,
});

await client.push('your-queue-id', 'demo.message', {
    text: 'hello from node',
});

const message = await client.pop('your-queue-id');
```

`apiKey` is optional. Use it when you want reusable authenticated access.

### Python SDK Quickstart

Install from PyPI:

```bash
pip install poofmq
```

```python
import os

from poofmq import PoofmqClient

client = PoofmqClient(
    base_url=os.environ["POOFMQ_BASE_URL"],
    api_key=os.getenv("POOFMQ_API_KEY"),
)

client.push(
    queue_id="your-queue-id",
    event_type="demo.message",
    payload={"text": "hello from python"},
)

message = client.pop("your-queue-id")
```

`api_key` is optional for the same reason as `apiKey` in the Node SDK.

### Push Messages

Both SDKs expose the same conceptual push operation:

- Required: queue ID, event type, payload
- Optional: TTL, available-at timestamp, idempotency key. Use TTL for message expiry, available-at for scheduling, and idempotency key to avoid duplicates.
- Route: `POST /v1/queues/{queue_id}/messages`

### Pop Messages

Both SDKs expose the same conceptual pop operation:

- Returns the next visible message or an empty value when the queue is empty
- Optional: visibility timeout, wait timeout, consumer ID. Use visibility timeout to hide the message from other consumers while processing, wait timeout for long polling, and consumer ID for at-least-once tracking.
- Route: `POST /v1/queues/{queue_id}/messages:pop`

### Client-side Encryption

Both SDKs support client-side AES-GCM encryption for zero-knowledge payload storage.

- Encrypt before sending with `encrypt: true` / `encrypt=True`
- Provide an encryption secret with `encryptionKey` or `encryption_key`
- Decrypt a popped message with the same secret using the SDK's decrypt helper (see [Node](../sdks/node/README.md) and [Python](../sdks/python/README.md) READMEs)

### Error Handling

Use the wrapper clients for normal queue work and treat transport, authentication, and validation failures as exceptions from the generated client layer. For HTTP status codes and error response shapes, see the OpenAPI spec (`dist/openapi/v1/poofmq.json`) or the [compatibility policy](compatibility-policy.md).

Empty queue behavior is not an error:

- Node: `client.pop(...)` returns `null`
- Python: `client.pop(...)` returns `None`

### API Reference

Node:

```ts
new PoofmqClient({ baseUrl, apiKey? })
client.push(queueId, eventType, payload, options?)
client.pop(queueId, options?)
```

Python:

```python
PoofmqClient(base_url, api_key=None)
client.push(queue_id, event_type, payload, **options)
client.pop(queue_id, **options)
```

## OpenAPI and compatibility

- OpenAPI artifact: `dist/openapi/v1/poofmq.json`
- Compatibility policy: `docs/compatibility-policy.md`
- SDK verification notes: `docs/openapi-sdk-verification.md`

## Next steps

- Node SDK details: `sdks/node/README.md`
- Python SDK details: `sdks/python/README.md`
- SDK overview and regeneration workflow: `sdks/README.md`
