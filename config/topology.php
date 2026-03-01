<?php

return [
    'services' => [
        'laravel-portal' => [
            'runtime' => 'php-fpm|php-cli',
            'responsibility' => 'Operator dashboard, auth, queue management workflows, and admin APIs.',
        ],
        'go-api' => [
            'runtime' => 'go',
            'responsibility' => 'Queue ingestion/dequeue APIs, TTL orchestration, and Redis-backed queue operations.',
        ],
        'redis' => [
            'runtime' => 'redis',
            'responsibility' => 'Ephemeral queue storage and short-lived coordination state.',
        ],
        'postgres' => [
            'runtime' => 'postgresql',
            'responsibility' => 'Durable relational data for Laravel accounts, settings, and operational metadata.',
        ],
    ],

    'env_ownership' => [
        'APP_NAME' => ['owner' => 'laravel-portal', 'consumers' => ['laravel-portal']],
        'APP_ENV' => ['owner' => 'laravel-portal', 'consumers' => ['laravel-portal']],
        'APP_DEBUG' => ['owner' => 'laravel-portal', 'consumers' => ['laravel-portal']],
        'APP_URL' => ['owner' => 'laravel-portal', 'consumers' => ['laravel-portal']],
        'PORTAL_HTTP_PORT' => ['owner' => 'laravel-portal', 'consumers' => ['laravel-portal']],
        'DB_CONNECTION' => ['owner' => 'laravel-portal', 'consumers' => ['laravel-portal']],
        'DB_HOST' => ['owner' => 'postgres', 'consumers' => ['laravel-portal']],
        'DB_PORT' => ['owner' => 'postgres', 'consumers' => ['laravel-portal']],
        'DB_DATABASE' => ['owner' => 'postgres', 'consumers' => ['laravel-portal']],
        'DB_USERNAME' => ['owner' => 'postgres', 'consumers' => ['laravel-portal']],
        'DB_PASSWORD' => ['owner' => 'postgres', 'consumers' => ['laravel-portal']],
        'POSTGRES_HOST_PORT' => ['owner' => 'postgres', 'consumers' => ['laravel-portal']],
        'REDIS_HOST' => ['owner' => 'redis', 'consumers' => ['laravel-portal', 'go-api']],
        'REDIS_PORT' => ['owner' => 'redis', 'consumers' => ['laravel-portal', 'go-api']],
        'REDIS_HOST_PORT' => ['owner' => 'redis', 'consumers' => ['laravel-portal', 'go-api']],
        'REDIS_PASSWORD' => ['owner' => 'redis', 'consumers' => ['laravel-portal', 'go-api']],
        'REDIS_QUEUE' => ['owner' => 'go-api', 'consumers' => ['laravel-portal', 'go-api']],
        'QUEUE_CONNECTION' => ['owner' => 'laravel-portal', 'consumers' => ['laravel-portal']],
        'CACHE_STORE' => ['owner' => 'laravel-portal', 'consumers' => ['laravel-portal']],
        'GO_API_BASE_URL' => ['owner' => 'go-api', 'consumers' => ['laravel-portal']],
        'GO_API_TIMEOUT_SECONDS' => ['owner' => 'laravel-portal', 'consumers' => ['laravel-portal']],
        'GO_API_HTTP_PORT' => ['owner' => 'go-api', 'consumers' => ['go-api']],
        'GO_API_HOST_PORT' => ['owner' => 'go-api', 'consumers' => ['laravel-portal', 'go-api']],
        'GO_API_LOG_LEVEL' => ['owner' => 'go-api', 'consumers' => ['go-api']],
        'GO_API_ALLOW_ORIGIN' => ['owner' => 'go-api', 'consumers' => ['go-api']],
        'CLOUDFLARE_ACCOUNT_ID' => ['owner' => 'go-api', 'consumers' => ['go-api']],
        'CLOUDFLARE_API_TOKEN' => ['owner' => 'go-api', 'consumers' => ['go-api']],
        'RAILWAY_ENVIRONMENT_NAME' => ['owner' => 'laravel-portal', 'consumers' => ['laravel-portal', 'go-api']],
        'RAILWAY_PROJECT_ID' => ['owner' => 'laravel-portal', 'consumers' => ['laravel-portal', 'go-api']],
    ],

    'deployment_targets' => [
        'railway' => [
            'laravel-portal' => 'Primary web process and queue worker deployment target.',
            'postgres' => 'Managed Railway PostgreSQL instance.',
            'redis' => 'Managed Railway Redis instance.',
            'go-api' => 'Optional Railway fallback target when edge deployment is unavailable.',
        ],
        'cloudflare' => [
            'go-api' => 'Primary edge deployment target for low-latency API traffic.',
        ],
    ],
];
