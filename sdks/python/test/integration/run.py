#!/usr/bin/env python3
"""
Integration test for the poofMQ Python SDK. Requires a running API (e.g. docker compose up, API on port 8080).
Usage: GO_API_BASE_URL=http://localhost:8080 python -m test.integration.run
"""
from __future__ import annotations

import os
import sys

# Ensure poofmq is importable (run from sdks/python or repo root)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from poofmq import PoofmqClient

def main() -> None:
    base_url = os.environ.get("GO_API_BASE_URL", "http://localhost:8080")
    client = PoofmqClient(base_url=base_url)
    queue_id = "sdk-python-integration-test"

    # Push
    res = client.push(queue_id, "test.event", {"foo": "bar"})
    if not res or not getattr(res, "message_id", None):
        print("FAIL: push response missing message_id", file=sys.stderr)
        sys.exit(1)
    print("PUSH OK:", res.message_id)

    # Pop
    message = client.pop(queue_id)
    if not message or not message.envelope:
        print("FAIL: pop returned no message or envelope", file=sys.stderr)
        sys.exit(1)
    if message.envelope.event_type != "test.event":
        print("FAIL: event_type mismatch", message.envelope.event_type, file=sys.stderr)
        sys.exit(1)
    if message.envelope.payload != {"foo": "bar"}:
        print("FAIL: payload mismatch", message.envelope.payload, file=sys.stderr)
        sys.exit(1)
    print("POP OK:", message.envelope.event_type, message.envelope.payload)

if __name__ == "__main__":
    main()
