# poofMQ Python SDK

Client for the poofMQ API: push and pop messages with optional client-side AES-GCM encryption (zero-knowledge mode). Uses the OpenAPI-generated client and types as the single source of truth.

Install from PyPI:

```bash
pip install poofmq
```

## Usage

### Plaintext push and pop

```python
import os

from poofmq import PoofmqClient

base_url = os.environ.get("POOFMQ_BASE_URL")

if base_url is None:
    raise RuntimeError("Set POOFMQ_BASE_URL to the poofMQ API origin.")

client = PoofmqClient(
    base_url=base_url,
    api_key=os.environ.get("POOFMQ_API_KEY"),  # optional
)

# Push
res = client.push("my-queue-id", "user.created", {"user_id": "123"})
print("Message ID:", res.message_id)

# Pop
message = client.pop("my-queue-id")
if message:
    print("Event:", message.envelope.event_type, message.envelope.payload)
```

`POOFMQ_BASE_URL` should point to the API origin from the quickstart, not `https://poofmq.com`.

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

From the monorepo, install the package in editable mode and run against a local API:

```bash
make sdk-generate
cd sdks/python
pip install -e .
POOFMQ_BASE_URL=http://localhost:8080 python -m test.integration.run
```

Or from repo root:

```bash
POOFMQ_BASE_URL=http://localhost:8080 python sdks/python/test/integration/run.py
```

(ensure `sdks/python` is on `PYTHONPATH` or install the package first with `pip install -e sdks/python`).
