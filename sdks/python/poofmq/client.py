"""
poofMQ Python SDK client. Push/pop queue operations with optional client-side encryption.
Uses the OpenAPI-generated client and types as the single source of truth.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from openapi_client import ApiClient, Configuration, QueueServiceApi
from openapi_client.models import (
    QueueServicePopBody,
    QueueServicePushBody,
    V1EncryptionMode,
    V1PayloadEnvelope,
    V1PopMessageResponse,
    V1PushMessageResponse,
    V1QueueMessage,
)

from poofmq.encryption import encrypt_payload as _encrypt_payload


class PoofmqClient:
    """Client for the poofMQ API: push and pop with optional client-side encryption."""

    def __init__(self, base_url: str, api_key: Optional[str] = None) -> None:
        self._base_url = base_url.rstrip("/")
        config = Configuration(host=self._base_url)
        kwargs: Dict[str, Any] = {"configuration": config}
        if api_key:
            header_value = (
                api_key if api_key.startswith("Bearer ") else f"Bearer {api_key}"
            )
            kwargs["header_name"] = "Authorization"
            kwargs["header_value"] = header_value
        self._api_client = ApiClient(**kwargs)
        self._api = QueueServiceApi(self._api_client)

    def push(
        self,
        queue_id: str,
        event_type: str,
        payload: Dict[str, Any],
        *,
        ttl_seconds: Optional[int] = None,
        available_at: Optional[datetime] = None,
        idempotency_key: Optional[str] = None,
        encrypt: bool = False,
        encryption_key: Optional[str] = None,
    ) -> V1PushMessageResponse:
        """Push a message onto a queue. Supports plaintext and client-encrypted (zero-knowledge) flow."""
        if encrypt and encryption_key:
            enc = _encrypt_payload(payload, encryption_key)
            envelope = V1PayloadEnvelope(
                event_type=event_type,
                payload={},
                metadata={},
                encryption_mode=V1EncryptionMode.ENCRYPTION_MODE_CLIENT_ENCRYPTED,
                encryption_algorithm=enc["encryption_algorithm"],
                encrypted_payload=enc["encrypted_payload"],
                encryption_iv=enc["encryption_iv"],
                encryption_auth_tag=enc["encryption_auth_tag"],
            )
        else:
            envelope = V1PayloadEnvelope(
                event_type=event_type,
                payload=payload,
                metadata={},
                encryption_mode=V1EncryptionMode.ENCRYPTION_MODE_UNENCRYPTED,
            )
        body = QueueServicePushBody(
            envelope=envelope,
            ttl_seconds=ttl_seconds,
            available_at=available_at,
            idempotency_key=idempotency_key,
        )
        return self._api.queue_service_push(queue_id=queue_id, body=body)

    def pop(
        self,
        queue_id: str,
        *,
        visibility_timeout_seconds: Optional[int] = None,
        wait_timeout_seconds: Optional[int] = None,
        consumer_id: Optional[str] = None,
    ) -> Optional[V1QueueMessage]:
        """Pop a message from a queue. Returns None when the queue is empty."""
        body = QueueServicePopBody(
            visibility_timeout_seconds=visibility_timeout_seconds,
            wait_timeout_seconds=wait_timeout_seconds,
            consumer_id=consumer_id,
        )
        response: V1PopMessageResponse = self._api.queue_service_pop(
            queue_id=queue_id, body=body
        )
        return response.message
