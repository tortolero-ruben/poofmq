# poofMQ Node.js SDK

Client for the poofMQ API: push and pop messages with optional client-side AES-GCM encryption (zero-knowledge mode).

## Prerequisites

- Node.js 18+
- Generated API client: from the repo root run `make sdk-generate` so that `sdks/node/generated` exists.

## Install

From the monorepo:

```bash
cd sdks/node
npm install
npm run build
```

## Usage

### Plaintext push and pop

```javascript
import { PoofmqClient } from "poofmq";

const client = new PoofmqClient({
  baseUrl: process.env.GO_API_BASE_URL || "http://localhost:8080",
  apiKey: process.env.POOFMQ_API_KEY, // omit for sandbox
});

// Push
const res = await client.push("my-queue-id", "user.created", { user_id: "123" });
console.log("Message ID:", res.messageId);

// Pop
const message = await client.pop("my-queue-id");
if (message) {
  console.log("Event:", message.envelope?.eventType, message.envelope?.payload);
}
```

### Client-side encrypted push (zero-knowledge)

```javascript
const res = await client.push(
  "my-queue-id",
  "order.placed",
  { order_id: "ord-1", amount: 99 },
  { encrypt: true, encryptionKey: "my-secret-passphrase" }
);
```

Decrypt a popped message that was sent with client encryption using the same secret and the `decryptPayload` helper (see `encryption` export).

## API

- **`new PoofmqClient({ baseUrl, apiKey? })`** – Create a client.
- **`client.push(queueId, eventType, payload, options?)`** – Push a message. Options: `ttlSeconds`, `availableAt`, `idempotencyKey`, `encrypt`, `encryptionKey`.
- **`client.pop(queueId, options?)`** – Pop a message. Options: `visibilityTimeoutSeconds`, `waitTimeoutSeconds`, `consumerId`. Returns `null` when queue is empty.

## Integration tests

With the Go API and Redis running (e.g. `docker compose up -d` and start the API):

```bash
GO_API_BASE_URL=http://localhost:8080 npm run test:integration
```
