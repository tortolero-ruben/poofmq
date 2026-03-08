<?php

use App\Models\RailwayBillingSnapshot;
use App\Models\User;
use Illuminate\Support\Facades\Http;

it('includes observability metrics and alert payload in dashboard props', function () {
    config()->set('services.go_api.base_url', 'http://go-api.test');
    config()->set('services.go_api.timeout_seconds', 2);
    config()->set('observability.thresholds.error_rate_percent', 1.0);
    config()->set('observability.thresholds.railway_snapshot_max_age_minutes', 30);

    RailwayBillingSnapshot::factory()->create([
        'current_spend_cents' => 620,
        'captured_at' => now()->subMinutes(45),
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

    $user = User::factory()->create([
        'email' => 'rubentortolero@gmail.com',
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();

    expect($response->inertiaProps('admin.observability.metrics.throughput_total'))->toBe(220)
        ->and($response->inertiaProps('admin.observability.metrics.error_rate_percent'))->toBe(2.73)
        ->and($response->inertiaProps('admin.observability.metrics.burn_rate_cents_per_day'))->toBeGreaterThan(0)
        ->and($response->inertiaProps('admin.observability.metrics.railway_snapshot_age_minutes'))->toBeGreaterThan(30)
        ->and($response->inertiaProps('admin.observability.alerts'))->not->toBe([]);
});
