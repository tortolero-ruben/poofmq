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

## Quickstart and SDKs

See [docs/quickstart.md](docs/quickstart.md) for API base URL, Node.js and Python SDK install and usage. The portal **Developers** page (when logged in) links to in-repo quickstart and SDK docs.

## Convenience Commands

```bash
make bootstrap   # install deps + start infra + migrate
make infra-up    # start redis + postgres
make infra-down  # stop stack
make full-stack  # start all containers then run portal dev stack
make proto-generate         # regenerate gRPC, gateway, and OpenAPI artifacts
make generate-artifacts    # regenerate all artifacts, inject OpenAPI version, and publish to dist/
make openapi-publish       # copy gen/openapi/poofmq.swagger.json to dist/openapi/v1/poofmq.json
make sdk-generate          # regenerate Node/Python/Go/Java SDK stubs from OpenAPI (requires Docker)
make proto-check-generated  # regenerate and fail if tracked artifacts drift
BUF_VERSION=1.52.0 make proto-generate  # override default buf image version
```

## Auth Token Issuance and Revocation (RUB-250)

The Laravel portal uses Fortify for session authentication flows and Sanctum for API token authentication.

Token issuance and revocation behavior:
- Issue a token from application code with `User::createToken($name, $abilities)` and store the returned plain text value once on creation.
- Authenticate API requests with `Authorization: Bearer <plain-text-token>` against routes protected by `auth:sanctum`.
- Revoke a token by deleting it from the `personal_access_tokens` table through Eloquent (for example `User::tokens()->whereKey($tokenId)->delete()`).
- Revoked tokens are immediately rejected on subsequent requests.

See coverage in `tests/Feature/Auth/ApiTokenAuthenticationTest.php` and `tests/Feature/Auth`.

## API Key Reconciliation Runbook (RUB-255)

The reconciliation flow rebuilds Redis API key auth material from Postgres as source of truth.

What runs automatically:
- Scheduler enqueues `App\Jobs\ReconcileApiKeysToRedis` every 5 minutes in `routes/console.php`.
- The job retries with backoff (`tries=3`, `backoff=[5,30,60]`) and writes summary/error logs.

Manual recovery steps:
1. Check worker and scheduler health (`php artisan queue:work`, scheduler process, and queue backlog).
2. Inspect failed jobs with `php artisan queue:failed`.
3. Retry failed jobs with `php artisan queue:retry all` (or specific IDs), then monitor logs for completion.
4. Trigger an immediate reconciliation run with `php artisan app:reconcile-api-keys`.
5. Confirm logs contain `API key reconciliation completed` with expected `synced`, `deleted`, and `errors` counters.

Failure handling notes:
- Sync and reconcile jobs throw on Redis write/read failures so Laravel queue failure handling can dead-letter them into `failed_jobs`.
- Reconciliation safely removes orphaned Redis auth keys and rehydrates active keys, so it can be rerun idempotently after incidents.

## CI Status Checks

Pull requests are gated by the `ci` GitHub Actions workflow. Configure these job checks as required branch protections:

- `generated-artifacts`: runs `make ci-check-generated` and fails when generated proto/OpenAPI artifacts drift (`buf.lock`, `gen/go`, `gen/openapi`).
- `laravel-lint`: runs `make ci-lint-laravel` (`composer lint:check` / Pint).
- `frontend-lint`: runs `make ci-lint-frontend` (Prettier and ESLint checks).
- `laravel-tests`: runs `make ci-test-laravel` (`php artisan test --compact`).
- `go-lint`: runs `make ci-lint-go` (`gofmt` drift check + `go vet`).
- `go-unit-tests`: runs `make ci-test-go-unit` (all Go tests excluding `TestClientIntegration*`).
- `go-integration-tests`: runs `make ci-test-go-integration` (`TestClientIntegration*` with Testcontainers + Docker).

For local parity before pushing:

```bash
make generate-artifacts
make ci-check-generated
make proto-check-generated
make ci-lint-laravel
make ci-lint-frontend
make ci-test-laravel
make ci-lint-go
make ci-test-go-unit
make ci-test-go-integration
```
