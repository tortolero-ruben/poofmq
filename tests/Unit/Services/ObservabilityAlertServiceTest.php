<?php

use App\Services\ObservabilityAlertService;
use Tests\TestCase;

uses(TestCase::class);

it('flags alerts when thresholds are exceeded and includes runbook pointers', function () {
    config()->set('observability.thresholds.error_rate_percent', 5.0);
    config()->set('observability.thresholds.push_latency_ms', 75.0);
    config()->set('observability.thresholds.pop_latency_ms', 75.0);
    config()->set('observability.thresholds.redis_memory_bytes', 8000000);

    $alerts = app(ObservabilityAlertService::class)->evaluate([
        'error_rate_percent' => 8.2,
        'avg_push_latency_ms' => 95.0,
        'avg_pop_latency_ms' => 88.0,
        'redis_memory_bytes' => 9000000,
    ]);

    expect($alerts)->toHaveCount(4)
        ->and($alerts[0])->toHaveKeys(['key', 'severity', 'message', 'runbook']);
});

it('returns no alerts when metrics are healthy', function () {
    $alerts = app(ObservabilityAlertService::class)->evaluate([
        'error_rate_percent' => 0.2,
        'avg_push_latency_ms' => 10.0,
        'avg_pop_latency_ms' => 8.0,
        'redis_memory_bytes' => 1024,
    ]);

    expect($alerts)->toBe([]);
});
