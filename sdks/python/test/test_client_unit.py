"""Unit tests for poofMQ Python SDK (no API required)."""
from __future__ import annotations

import pytest
from poofmq import PoofmqClient, encrypt_payload, decrypt_payload


def test_client_construct_without_api_key() -> None:
    client = PoofmqClient(base_url="http://localhost:8080")
    assert client._base_url == "http://localhost:8080"


def test_client_construct_with_api_key() -> None:
    client = PoofmqClient(base_url="https://api.example.com/", api_key="sk-test-123")
    assert client._base_url == "https://api.example.com"


def test_encrypt_decrypt_roundtrip() -> None:
    payload = {"foo": "bar", "n": 42}
    secret = "my-secret"
    enc = encrypt_payload(payload, secret)
    assert "encrypted_payload" in enc
    assert enc["encryption_algorithm"] == "aes-256-gcm"
    dec = decrypt_payload(
        enc["encrypted_payload"],
        enc["encryption_iv"],
        enc["encryption_auth_tag"],
        secret,
    )
    assert dec == payload
