# ADR-0001: Redis Data Model, TTL Defaults, and Auth Key Namespace

- Date: 2026-03-01
- Status: Accepted
- Linear: RUB-240
- Blocks: RUB-242 assumptions for ephemerality/cost validation

## Context

poofMQ MVP depends on Redis for ephemeral queue state and authentication material checks. Before implementation deepens, we need stable decisions for:

1. Redis key naming and namespace ownership.
2. Queue TTL default values and queue-level override behavior.
3. Revocation propagation behavior for auth material.

Without these constants, implementation tasks can drift and NFR testing for latency, ephemerality, and cost can produce invalid results.

## Decision

### 1) Redis Namespacing

All Redis keys MUST use a two-level namespace with a product root and domain:

- Product root: `poofmq:v1`
- Domain namespaces:
  - `poofmq:v1:queue:*`
  - `poofmq:v1:auth:*`

This keeps room for non-breaking schema evolution (`v2`) and prevents collisions with other apps sharing Redis.

Namespace migration expectation:

- A future `poofmq:v2` rollout MUST be forward-compatible during migration windows by dual-reading (`v1` + `v2`) until backfill/cutover is complete, then removing `v1` reads on a scheduled deprecation date.

### 2) Queue Key Model

Queue resources and message resources MUST use the following key schema:

- Queue metadata hash:
  - `poofmq:v1:queue:{queueId}:meta`
- Queue index sorted set (message expiry score in epoch ms):
  - `poofmq:v1:queue:{queueId}:idx`
- Message payload by id:
  - `poofmq:v1:queue:{queueId}:msg:{messageId}`
- Optional idempotency lock (if producer idempotency is enabled):
  - `poofmq:v1:queue:{queueId}:idem:{idempotencyKey}`

`queueId` and `messageId` MUST be opaque identifiers (ULID/UUIDv7 preferred). Do not place PII or user-entered raw values in Redis key names.

### 3) Auth Key Model

Auth material MUST use these namespaces:

- Access token record (metadata only, no plaintext token):
  - `poofmq:v1:auth:token:{jti}`
- Per-token explicit revocation marker:
  - `poofmq:v1:auth:revoke:token:{jti}`
- Per-subject revocation watermark (revoke all before timestamp):
  - `poofmq:v1:auth:revoke:subject:{subjectId}`
- Revocation fanout channel (pub/sub):
  - `poofmq:v1:auth:events:revoked`

`jti` MUST be random and unique per token. Token values MUST NOT be used directly as Redis keys.

### 4) Queue TTL Defaults and Override Policy

Global constants for MVP:

- `GLOBAL_QUEUE_TTL_DEFAULT_SECONDS = 600` (10 minutes)
- `GLOBAL_QUEUE_TTL_MIN_SECONDS = 1`
- `GLOBAL_QUEUE_TTL_MAX_SECONDS = 86400` (24 hours)
- `GLOBAL_QUEUE_TTL_GRACE_SECONDS = 60` (cleanup/index skew tolerance)

Policy:

1. Publish request with no TTL uses the global default (`600`).
2. Requested TTL above global max is rejected with validation error.
3. Requested TTL below global min (`1`) is rejected with validation error.
4. Per-message TTL override is allowed only within global min/max.
5. Queue-level default TTL override is not part of MVP; if introduced later, it MUST remain within global min/max.
6. Queue metadata key TTL SHOULD be derived from the latest message expiry timestamp in `poofmq:v1:queue:{queueId}:idx`: on writes, compute remaining time until the highest expiry score and set/refresh metadata TTL to `remaining_time_until_latest_expiry + GLOBAL_QUEUE_TTL_GRACE_SECONDS`, so metadata expires shortly after the last message and after the queue becomes empty/idle.

This policy enforces ephemerality and caps memory/cost by default while keeping queue-level flexibility.

### 5) Auth TTL and Revocation Retention

- `poofmq:v1:auth:token:{jti}`: on write, Redis TTL MUST be set to `(token_expiry_timestamp - current_time) + 300 seconds` (skew buffer). Equivalently, this key MUST NOT exist after `token_expiry_timestamp + 300 seconds`.
- `poofmq:v1:auth:revoke:token:{jti}`: on write, Redis TTL MUST be set to at least `(token_expiry_timestamp - current_time) + 300 seconds`. Equivalently, this key MUST exist until at least `token_expiry_timestamp + 300 seconds`.
- `poofmq:v1:auth:revoke:subject:{subjectId}`: on write, Redis TTL MUST be set to at least `MAX_TOKEN_LIFETIME_SUPPORTED_BY_ISSUER` seconds from revocation write time.

## Revocation Propagation Expectations

Approved requirements:

1. Revocation write is authoritative once acknowledged by Redis primary.
2. Token validation MUST check both per-token revocation and per-subject revocation watermark.
3. Services with in-memory auth caches MUST cap cache TTL at 1 second for revocation-sensitive state.
4. Services SHOULD subscribe to `poofmq:v1:auth:events:revoked` to aggressively evict local caches.
5. End-to-end revocation propagation target: p95 <= 2 seconds, hard upper bound <= 5 seconds.
6. If revocation status cannot be determined (Redis unavailable), authentication checks for protected operations MUST fail closed.

## Security Implications

- Namespace isolation (`poofmq:v1`) reduces accidental cross-app key collisions.
- No plaintext tokens in keys or values reduces leakage impact from keyspace inspection.
- Opaque IDs in keys avoid exposing sensitive identifiers.
- Fail-closed revocation checks prefer security over availability for protected operations.
- Queue TTL caps reduce data retention risk and align with ephemeral product intent.
- Pub/sub revocation fanout lowers stale-auth windows in horizontally scaled services.

## Consequences

Positive:

- Clear constants for implementation and NFR validation.
- Predictable cost/retention envelope from bounded TTL defaults.
- Standardized revocation behavior across services.

Tradeoffs:

- Strict max TTL may require explicit product exceptions for long-lived workloads.
- Fail-closed auth behavior can surface temporary auth-denied responses during Redis incidents.

## Implementation References

Implementation tasks MUST reference this ADR and reuse these constants (or equivalent config keys):

- `poofmq:v1` namespace root
- `GLOBAL_QUEUE_TTL_DEFAULT_SECONDS = 600`
- `GLOBAL_QUEUE_TTL_MAX_SECONDS = 86400`
- Revocation propagation target: p95 <= 2 seconds, max <= 5 seconds
- API/proto validation MUST enforce `GLOBAL_QUEUE_TTL_MIN_SECONDS` and `GLOBAL_QUEUE_TTL_MAX_SECONDS`.

RUB-242 must use these values when validating ephemerality/cost and revocation NFR assumptions.

## Review Checklist

- [ ] Security review confirms fail-closed behavior and key naming constraints.
- [ ] Platform review confirms TTL caps align with memory/cost targets.
- [ ] API/worker implementation tickets link back to this ADR.
