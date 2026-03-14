# poofMQ Node.js SDK

Client for the poofMQ API: push and pop messages with optional client-side AES-GCM encryption (zero-knowledge mode).

Install from npm:

```bash
npm install @poofmq/node
```

## Usage

### Plaintext push and pop

```javascript
import { PoofmqClient } from '@poofmq/node';

const baseUrl = process.env.POOFMQ_BASE_URL;

if (!baseUrl) {
    throw new Error('Set POOFMQ_BASE_URL to the poofMQ API origin.');
}

const client = new PoofmqClient({
    baseUrl,
    apiKey: process.env.POOFMQ_API_KEY, // optional
});

// Push
const res = await client.push('my-queue-id', 'user.created', {
    user_id: '123',
});
console.log('Message ID:', res.messageId);

// Pop
const message = await client.pop('my-queue-id');
if (message) {
    console.log(
        'Event:',
        message.envelope?.eventType,
        message.envelope?.payload,
    );
}
```

`POOFMQ_BASE_URL` should point to the API origin from the quickstart, not `https://poofmq.com`.

### Client-side encrypted push (zero-knowledge)

```javascript
const res = await client.push(
    'my-queue-id',
    'order.placed',
    { order_id: 'ord-1', amount: 99 },
    { encrypt: true, encryptionKey: 'my-secret-passphrase' },
);
```

Decrypt a popped message that was sent with client encryption using the same secret and the `decryptPayload` helper (see `encryption` export).

## API

- **`new PoofmqClient({ baseUrl, apiKey? })`** – Create a client.
- **`client.push(queueId, eventType, payload, options?)`** – Push a message. Options: `ttlSeconds`, `availableAt`, `idempotencyKey`, `encrypt`, `encryptionKey`.
- **`client.pop(queueId, options?)`** – Pop a message. Options: `visibilityTimeoutSeconds`, `waitTimeoutSeconds`, `consumerId`. Returns `null` when queue is empty.

## Integration tests

From the monorepo, build the package first and run against a local API:

```bash
make sdk-generate
cd sdks/node
npm install
npm run build
POOFMQ_BASE_URL=http://localhost:8080 npm run test:integration
```
