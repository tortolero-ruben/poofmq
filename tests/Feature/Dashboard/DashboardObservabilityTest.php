<?php

use App\Models\RailwayBillingSnapshot;
use App\Models\User;
use Illuminate\Support\Facades\Http;

it('includes observability metrics and alert payload in dashboard props', function () {
    config()->set('services.go_api.base_url', 'http://go-api.test');
    config()->set('services.go_api.timeout_seconds', 2);
    config()->set('observability.thresholds.error_rate_percent', 1.0);

    RailwayBillingSnapshot::factory()->create([
        'month_to_date_spend_cents' => 620,
        'captured_at' => now(),
    ]);

    Http::fake([
        'http://go-api.test/metrics' => Http::response([
            'push_total' => 120,
            'push_errors_total' => 4,
            'pop_total' => 100,
            'pop_errors_total' => 2,
            'avg_push_latency_ms' => 42.5,
            'avg_pop_latency_ms' => 35.1,
            'redis_memory_bytes' => 7340032,
        ], 200),
    ]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();

    expect($response->inertiaProps('observability.metrics.ops_total'))->toBe(220)
        ->and($response->inertiaProps('observability.metrics.error_rate_percent'))->toBe(2.73)
        ->and($response->inertiaProps('observability.metrics.redis_memory_bytes'))->toBe(7340032)
        ->and($response->inertiaProps('observability.metrics.burn_rate_cents_per_day'))->toBeGreaterThan(0)
        ->and($response->inertiaProps('observability.alerts'))->not->toBe([]);
});
