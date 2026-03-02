# poofMQ Python SDK

Client for the poofMQ API: push and pop messages with optional client-side AES-GCM encryption (zero-knowledge mode). Uses the OpenAPI-generated client and types as the single source of truth.

## Prerequisites

- Python 3.10+
- Generated API client: from the repo root run `make sdk-generate` so that `sdks/python/generated` exists.

## Install

From the monorepo (from repo root, generate first, then install the generated client and SDK):

```bash
make sdk-generate
cd sdks/python
pip install ./generated
pip install -e .
```

## Usage

### Plaintext push and pop

```python
from poofmq import PoofmqClient
import os

client = PoofmqClient(
    base_url=os.environ.get("GO_API_BASE_URL", "http://localhost:8080"),
    api_key=os.environ.get("POOFMQ_API_KEY"),  # omit for sandbox
)

# Push
res = client.push("my-queue-id", "user.created", {"user_id": "123"})
print("Message ID:", res.message_id)

# Pop
message = client.pop("my-queue-id")
if message:
    print("Event:", message.envelope.event_type, message.envelope.payload)
```

### Client-side encrypted push (zero-knowledge)

```python
res = client.push(
    "my-queue-id",
    "order.placed",
    {"order_id": "ord-1", "amount": 99},
    encrypt=True,
    encryption_key="my-secret-passphrase",
)
```

Decrypt a popped message that was sent with client encryption using the same secret and the `decrypt_payload` helper (see `poofmq.encryption`).

## API

- **`PoofmqClient(base_url, api_key=None)`** – Create a client.
- **`client.push(queue_id, event_type, payload, *, ttl_seconds=..., available_at=..., idempotency_key=..., encrypt=False, encryption_key=...)`** – Push a message.
- **`client.pop(queue_id, *, visibility_timeout_seconds=..., wait_timeout_seconds=..., consumer_id=...)`** – Pop a message. Returns `None` when queue is empty.

## Integration tests

With the Go API and Redis running (e.g. `docker compose up -d` and start the API):

```bash
cd sdks/python
GO_API_BASE_URL=http://localhost:8080 python -m test.integration.run
```

Or from repo root:

```bash
GO_API_BASE_URL=http://localhost:8080 python sdks/python/test/integration/run.py
```
(ensure `sdks/python` is on `PYTHONPATH` or install the package first with `pip install -e sdks/python`).
