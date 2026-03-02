# ADR-0002: Redis Maxmemory and Eviction Policy for Graceful Overload Handling

- Date: 2026-03-01
- Status: Accepted
- Linear: RUB-247
- Depends on: RUB-240 (ADR-0001 - Redis Data Model, TTL, Auth Namespace)

## Context

poofMQ uses Redis as the backing store for ephemeral queue state and authentication material. Per ADR-0001, all queue and auth keys have TTL values:

- Queue message TTL: 1-86400 seconds (default 600)
- Auth token keys: TTL tied to token expiry + 300s buffer
- Revocation markers: TTL tied to token lifetime

Without memory limits and an eviction policy, Redis can consume unbounded memory under load spikes, potentially causing:

1. OOM kills by the operating system
2. Cascading failures across dependent services
3. Unpredictable latency degradation

We need a configuration that provides graceful degradation under memory pressure while respecting poofMQ's ephemeral, TTL-based design.

## Decision

### 1) Maxmemory Configuration

Redis MUST be configured with an explicit memory limit via `maxmemory`:

- **Local development**: 256MB (provides ample room for testing)
- **Production**: 70-80% of available RAM (leaves room for OS buffers)

The limit is configurable via environment variable to support different deployment targets.

### 2) Eviction Policy: `volatile-ttl`

Redis MUST use `volatile-ttl` as the eviction policy:

```
maxmemory-policy volatile-ttl
```

This policy evicts keys with TTL set, preferring those with the shortest remaining TTL.

**Rationale for `volatile-ttl`:**

1. **All poofMQ keys have TTL**: Per ADR-0001, queue messages and auth keys always have TTL set.
2. **Graceful degradation**: Messages closest to expiry are evicted first, minimizing data loss impact.
3. **Preserves newer messages**: Recent messages with longer TTL survive longer under pressure.
4. **No accidental eviction of non-TTL keys**: If any configuration or persistent keys exist, they are protected.

**Alternatives considered:**

| Policy | Rejected Because |
|--------|-----------------|
| `noeviction` | Returns OOM errors, not graceful |
| `allkeys-lru` | Evicts based on access, not TTL; may evict fresh messages |
| `allkeys-lfu` | Evicts based on frequency; queue patterns don't favor frequent access |
| `volatile-lru` | LRU less aligned with TTL-based ephemeral design |
| `volatile-random` | Non-deterministic, may evict fresh messages |

### 3) Eviction Sample Size

```
maxmemory-samples 10
```

Increased from default (5) to improve eviction accuracy. With TTL-based eviction, a larger sample better identifies the truly shortest TTL among candidates.

### 4) Configuration File Location

Redis configuration lives in `infra/redis/`:

- `redis.conf` - Template with environment variable placeholders for production
- `redis.local.conf` - Hardcoded values for local development

Docker Compose mounts the appropriate config file at container startup.

## Security Implications

1. **Memory bounds prevent resource exhaustion attacks**: An attacker flooding the queue cannot consume unbounded memory.
2. **Eviction prefers data near expiry**: Even under attack, eviction removes data already scheduled for deletion.
3. **No persistence reduces attack surface**: RDB and AOF are disabled; no disk-based data to exfiltrate.

## Consequences

Positive:

- Predictable memory footprint under all load conditions.
- Graceful degradation: oldest/expiring messages dropped first.
- Aligns with ephemeral queue design (messages have short TTL anyway).
- Prevents OOM kills that would affect all Redis clients.

Tradeoffs:

- Under extreme memory pressure, valid messages may be evicted before their TTL.
- Producers must handle retry logic if messages are evicted before consumption.
- Monitoring required to track eviction rate and memory utilization.

## Monitoring Recommendations

Operations SHOULD monitor these Redis metrics:

- `used_memory`: Current memory usage
- `used_memory_peak`: Peak memory usage
- `evicted_keys`: Count of keys evicted due to maxmemory
- `expired_keys`: Count of keys expired naturally

Alert thresholds:

- Warning: `used_memory > 80% of maxmemory`
- Critical: `used_memory > 90% of maxmemory`
- Investigate: `evicted_keys` increasing rapidly

## Implementation References

Configuration files:

- `/infra/redis/redis.conf` - Production template
- `/infra/redis/redis.local.conf` - Local development
- `/docker-compose.yml` - Mounts config and starts Redis with it

Key settings:

- `maxmemory`: 256mb (local), configurable (production)
- `maxmemory-policy`: volatile-ttl
- `maxmemory-samples`: 10

## Review Checklist

- [x] Eviction policy aligns with TTL-based key model from ADR-0001
- [x] Memory limits prevent unbounded growth
- [x] Configuration is environment-variable configurable for production
- [x] Local development has sensible defaults
