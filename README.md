# poofMQ MVP Topology Baseline

This repository contains the Laravel management portal and a baseline Go API service used by the two-brain architecture.

**Using poofMQ?** To send and receive messages, start with the [Quickstart](docs/quickstart.md). The portal Developers page (when logged in) and in-app docs mirror the same guide.

## Docs Map

- [Quickstart](docs/quickstart.md) - queue creation, auth options, HTTP examples, and SDK getting-started snippets.
- [SDK overview](sdks/README.md) - language support and regeneration workflow.
- [Documentation index](docs/README.md) - maintainer docs, ADRs, and release-process references.

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

## Deploying the Laravel Portal to Railway

The portal is set up for Railway’s “majestic monolith” pattern: one repo, multiple services (web, worker, cron).

**Prerequisites:** Railway project with **PostgreSQL** and **Redis**. You can add them manually in the dashboard or automate with the CLI (see below).

**Deploy order (DB first):** Railway deploys a service only after any services it depends on via variable references. Set the app’s `DB_URL` to `${{Postgres.DATABASE_URL}}` (and Redis vars to the Redis service). That makes Postgres (and Redis) deploy before the app, worker, and cron. Add Postgres and Redis to the project first, set these variables on the app/worker/cron services, then deploy the app. [`railway/init-app.sh`](railway/init-app.sh) also waits for the database to be reachable before running migrations, so pre-deploy succeeds even if there’s a short race.

**If Postgres and Redis are already deployed:** On each app, worker, and cron service set: `DB_CONNECTION=pgsql`, `DB_URL` = `${{Postgres.DATABASE_URL}}` (use your Postgres service name if different), `REDIS_URL` = `${{Redis.REDIS_URL}}` (or your Redis service name), `QUEUE_CONNECTION=redis`, `CACHE_STORE=redis`, `SESSION_DRIVER=redis`, plus `APP_KEY`, `APP_ENV`, `APP_URL`, and any other required vars below. Then deploy the app.

**Config as code (versioned):** The Laravel app’s build and deploy are defined in the repo so they can be redeployed consistently:

- **[railpack.json](railpack.json)** — Railpack build/deploy: PHP 8.4, Laravel document root `public/`, skip Railpack’s default migrations (we run them in pre-deploy).
- **[railway.json](railway.json)** — Railway deploy: Railpack builder, build command `npm run build`, pre-deploy (migrate), healthcheck `/up`, restart policy.
- **[railway/*.sh](railway/)** — Scripts used by pre-deploy and by the worker/cron services.

You do not need to set a custom build or pre-deploy command in the dashboard; the config in code overrides it.

**1. App service (HTTP)**  
- Source: this repo (root).  
- **Build / Deploy:** Handled by [railway.json](railway.json) and [railpack.json](railpack.json) (no need to set custom build or pre-deploy in the dashboard).  
- **Variables:** all portal env vars (see below). Use `DB_URL` = `${{Postgres.DATABASE_URL}}` and Redis from the Redis service: `REDIS_URL` = `${{Redis.REDIS_URL}}` (or `${{Redis.REDIS_PRIVATE_URL}}` for in-project traffic). Alternatively set `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` from the Redis service.  
- Generate a **public domain** in Networking.

**2. Worker service (queue)**  
- Same repo. Uses [railway-worker.json](railway-worker.json) (RAILPACK, PHP 8.4; start command in config).  
- **Variables:** same as App service (same env set).

**3. Cron service (scheduler)**  
- Same repo. Uses [railway-cron.json](railway-cron.json) (RAILPACK, PHP 8.4; start command in config).  
- **Variables:** same as App service.

**Adding Worker and Cron:** Create two new services from the same GitHub repo in the Railway dashboard: **Deploy** → **New Service** → **GitHub Repo** → select this repo. Name one **Worker** and the other **Cron**. For each service, set the **Railway config file path** (in **Settings** → **Build** or **Settings** → **Deploy**, depending on UI) so it uses the correct config: **Worker** → `railway-worker.json`, **Cron** → `railway-cron.json`. That forces RAILPACK (PHP 8.4) and sets the start command in code. Then from the repo root run `make railway-set-worker-cron-vars` (or `./railway/set-worker-cron-variables.sh`) to set DB/Redis (and optional NIXPACKS fallback) variables on both. Ensure `APP_KEY`, `APP_ENV`, and `APP_URL` are set (e.g. at environment level or on each service).

**If Worker or Cron build still fails** with a PHP version error: confirm the service’s **config file path** is set to `railway-worker.json` or `railway-cron.json` so it uses RAILPACK. Without that, Railway may build with Nixpacks (PHP 8.2). As a fallback you can set `NIXPACKS_PHP_VERSION=8.4` on the service and redeploy.

**Required / important variables for production**

- `APP_KEY` — from `php artisan key:generate`.  
- `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` — your public portal URL (e.g. `https://your-app.up.railway.app`).  
- `DB_CONNECTION=pgsql`, `DB_URL` — `${{Postgres.DATABASE_URL}}`.  
- Redis: `REDIS_URL` = `${{Redis.REDIS_URL}}` (or `REDIS_PRIVATE_URL` for private network), or `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` from the Redis service.  
- `QUEUE_CONNECTION=redis`, `CACHE_STORE=redis`, `SESSION_DRIVER=redis`.  
- `SESSION_SECURE_COOKIE=true` (Railway serves over HTTPS).  
- `LOG_CHANNEL=stderr`, `LOG_STDERR_FORMATTER=\Monolog\Formatter\JsonFormatter` (optional; for Railway log aggregation).  
- Optional: `CLOUDFLARE_TURNSTILE_SITE_KEY`, `CLOUDFLARE_TURNSTILE_SECRET_KEY` (for Sandbox).  
- Optional: `GO_API_BASE_URL` (if you deploy the Go API elsewhere and point the portal at it).

Scripts used: [`railway/init-app.sh`](railway/init-app.sh) (migrate), [`railway/run-worker.sh`](railway/run-worker.sh) (queue worker), [`railway/run-cron.sh`](railway/run-cron.sh) (scheduler). See [Railway’s Laravel guide](https://docs.railway.app/guides/laravel) for more detail.

**Automate Redis (and Postgres) on Railway:** From the repo root with the project already linked (`railway link`), run:

```bash
make railway-add-redis        # add Redis only
make railway-add-databases    # add Redis and Postgres
```

Or run the script directly: `./railway/add-redis.sh` or `./railway/add-redis.sh --postgres`. This uses the [Railway CLI](https://docs.railway.com/guides/cli) `railway add --database redis` (and `--database postgres`). After adding, set your app (and worker/cron) variables: `DB_URL` = `${{Postgres.DATABASE_URL}}`, `REDIS_URL` = `${{Redis.REDIS_URL}}` (or Redis’s `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD`). Re-link to your Laravel app service before the next deploy: `railway link`.

**Railway MCP:** If you use the Railway MCP in Cursor (e.g. `check-railway-status`, `list-projects`, `list-services`, `deploy`, `set-variables`, `generate-domain`), install the [Railway CLI](https://docs.railway.com/guides/cli) and run `railway login` and `railway link` in this repo so the MCP can talk to your project.

## Quickstart and SDKs

See [docs/quickstart.md](docs/quickstart.md) for queue setup, API base URL guidance, and Node.js and Python SDK usage. The portal **Developers** page (when logged in) links to the same guide, while [sdks/README.md](sdks/README.md) summarizes all language SDKs.

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
make railway-add-redis      # add Redis to linked Railway project (CLI)
make railway-add-databases  # add Redis + Postgres to linked Railway project (CLI)
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
