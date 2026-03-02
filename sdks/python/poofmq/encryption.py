"""
Optional client-side AES-GCM encryption helper for zero-knowledge push flow.
Encrypts the payload locally before send; the server stores opaque ciphertext.
"""

from __future__ import annotations

import base64
import json
from typing import Any, Dict, Union

# Prefer cryptography; fall back to PyCrypto-style for minimal deps (stdlib has no AES-GCM)
try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
    _HAS_CRYPTOGRAPHY = True
except ImportError:
    _HAS_CRYPTOGRAPHY = False

ALGORITHM = "aes-256-gcm"
KEY_LEN = 32
IV_LEN = 12
AUTH_TAG_LEN = 16
SCRYPT_SALT = b"poofmq-salt"
SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1


def _derive_key(secret: Union[str, bytes]) -> bytes:
    if _HAS_CRYPTOGRAPHY:
        kdf = Scrypt(
            salt=SCRYPT_SALT,
            length=KEY_LEN,
            n=SCRYPT_N,
            r=SCRYPT_R,
            p=SCRYPT_P,
        )
        if isinstance(secret, str):
            secret = secret.encode("utf-8")
        return kdf.derive(secret)
    raise RuntimeError(
        "client-side encryption requires the 'cryptography' package: pip install cryptography"
    )


def encrypt_payload(plaintext: Dict[str, Any], secret: Union[str, bytes]) -> Dict[str, str]:
    """
    Encrypt a payload with AES-256-GCM using a secret (password or key material).
    Returns the fields needed for V1PayloadEnvelope in client-encrypted mode.
    """
    if not _HAS_CRYPTOGRAPHY:
        raise RuntimeError(
            "client-side encryption requires the 'cryptography' package: pip install cryptography"
        )
    key = _derive_key(secret)
    aesgcm = AESGCM(key)
    payload_bytes = json.dumps(plaintext).encode("utf-8")
    nonce = __import__("os").urandom(IV_LEN)
    ciphertext = aesgcm.encrypt(nonce, payload_bytes, None)
    # GCM appends 16-byte tag to ciphertext
    ct = ciphertext[:-AUTH_TAG_LEN]
    tag = ciphertext[-AUTH_TAG_LEN:]
    return {
        "encrypted_payload": base64.b64encode(ct).decode("ascii"),
        "encryption_algorithm": ALGORITHM,
        "encryption_iv": base64.b64encode(nonce).decode("ascii"),
        "encryption_auth_tag": base64.b64encode(tag).decode("ascii"),
    }


def decrypt_payload(
    encrypted_payload: str,
    encryption_iv: str,
    encryption_auth_tag: str,
    secret: Union[str, bytes],
) -> Dict[str, Any]:
    """Decrypt a payload encrypted with encrypt_payload (e.g. from a popped message)."""
    if not _HAS_CRYPTOGRAPHY:
        raise RuntimeError(
            "client-side decryption requires the 'cryptography' package: pip install cryptography"
        )
    key = _derive_key(secret)
    aesgcm = AESGCM(key)
    ct = base64.b64decode(encrypted_payload)
    nonce = base64.b64decode(encryption_iv)
    tag = base64.b64decode(encryption_auth_tag)
    ciphertext = ct + tag
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return json.loads(plaintext.decode("utf-8"))
