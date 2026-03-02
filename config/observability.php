<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Alert Thresholds
    |--------------------------------------------------------------------------
    |
    | Core launch SLO thresholds used to evaluate whether metrics are healthy.
    | Values are intentionally conservative for MVP launch hardening.
    |
    */
    'thresholds' => [
        'error_rate_percent' => (float) env('POOFMQ_OBS_ERROR_RATE_PERCENT', 2.0),
        'push_latency_ms' => (float) env('POOFMQ_OBS_PUSH_LATENCY_MS', 75.0),
        'pop_latency_ms' => (float) env('POOFMQ_OBS_POP_LATENCY_MS', 75.0),
        'redis_memory_bytes' => (int) env('POOFMQ_OBS_REDIS_MEMORY_BYTES', 8000000),
        'burn_rate_cents_per_day' => (float) env('POOFMQ_OBS_BURN_RATE_CENTS_PER_DAY', 20.0),
    ],

    /*
    |--------------------------------------------------------------------------
    | Runbook Guidance
    |--------------------------------------------------------------------------
    |
    | Each alert key maps to an operator action sequence for first response.
    | These messages are surfaced directly in the dashboard alert payload.
    |
    */
    'runbooks' => [
        'error_rate_percent' => 'Inspect Go API error logs and recent deploys; rollback or throttle traffic if errors stay elevated for 5 minutes.',
        'push_latency_ms' => 'Check Redis latency and Go API CPU saturation; reduce ingress load and verify queue pressure.',
        'pop_latency_ms' => 'Inspect consumer contention and Redis saturation; scale consumers and confirm no blocking pop loops.',
        'redis_memory_bytes' => 'Review Redis memory policy/evictions and queue volume; drain stale queues and raise memory limits if needed.',
        'burn_rate_cents_per_day' => 'Review Railway spend drivers and prune non-essential workloads to protect monthly runway.',
    ],
];
