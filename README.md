# poofMQ MVP Topology Baseline

This repository contains the Laravel management portal and a baseline Go API service used by the two-brain architecture.

## Service Boundaries

| Service | Role | Data Ownership |
| --- | --- | --- |
| Laravel Portal | Management UI, auth, settings, and operator workflows. | App configuration, user/session/metadata in Postgres. |
| Go API | Queue ingress/dequeue APIs and TTL-oriented queue operations. | Runtime API behavior and queue protocol settings. |
| Redis | Ephemeral queue state and fast queue operations. | Queue payload/state keys. |
| Postgres | Durable relational persistence. | Portal account/settings/ops metadata. |

Machine-readable ownership and deployment target mapping lives in [`config/topology.php`](config/topology.php).

## Local Development (Clean Machine)

Prerequisites:
- PHP 8.4+
- Composer
- Node.js 22+
- Docker

1. Copy environment files.

```bash
cp .env.example .env
cp services/go-api/.env.example services/go-api/.env
```

2. Install portal dependencies.

```bash
composer install
npm install
```

3. Start infrastructure and Go API.

```bash
docker compose up -d
```

If a local port is already in use, override host ports in `.env` before startup:

```bash
REDIS_HOST_PORT=16379
POSTGRES_HOST_PORT=15432
GO_API_HOST_PORT=18081
```

Then align Laravel app ports in `.env`:

```bash
REDIS_PORT=16379
DB_PORT=15432
GO_API_BASE_URL=http://localhost:18081
```

4. Initialize Laravel and run migrations.

```bash
php artisan key:generate
php artisan migrate --force
```

5. Run the portal dev server stack.

```bash
composer run dev
```

Local endpoints (defaults; host ports are configurable):
- Laravel portal: `http://localhost:8000`
- Go API: `http://localhost:${GO_API_HOST_PORT:-8080}`
- Redis: `localhost:${REDIS_HOST_PORT:-6379}`
- Postgres: `localhost:${POSTGRES_HOST_PORT:-5432}`

## Environment Ownership Contract

Ownership is explicit and versioned in [`config/topology.php`](config/topology.php) under `env_ownership`.

Examples:
- `DB_*` keys are owned by `postgres` and consumed by `laravel-portal`.
- `REDIS_*` host/port/password keys are owned by `redis` and consumed by both application services.
- `GO_API_*` keys are owned by `go-api` except `GO_API_TIMEOUT_SECONDS`, which is owned by `laravel-portal` as a client policy.

## Deployment Mapping

Railway target mapping:
- `laravel-portal`: primary web and queue-worker runtime.
- `postgres`: managed Railway PostgreSQL.
- `redis`: managed Railway Redis.
- `go-api`: fallback runtime if edge deployment is unavailable.

Cloudflare target mapping:
- `go-api`: primary edge deployment target for low-latency API traffic.

These mappings are also defined in [`config/topology.php`](config/topology.php) under `deployment_targets`.

## Convenience Commands

```bash
make bootstrap   # install deps + start infra + migrate
make infra-up    # start redis + postgres
make infra-down  # stop stack
make full-stack  # start all containers then run portal dev stack
make proto-generate         # regenerate gRPC, gateway, and OpenAPI artifacts
make proto-check-generated  # regenerate and fail if tracked artifacts drift
```
