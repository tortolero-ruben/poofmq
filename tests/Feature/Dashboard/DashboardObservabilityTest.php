<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

it('includes queue observability metrics and alert payload in dashboard props', function () {
    config()->set('services.go_api.base_url', 'http://go-api.test');
    config()->set('services.go_api.timeout_seconds', 2);
    config()->set('observability.thresholds.error_rate_percent', 1.0);
    config()->set('observability.thresholds.push_latency_ms', 40.0);
    config()->set('observability.thresholds.pop_latency_ms', 30.0);
    config()->set('observability.thresholds.redis_memory_bytes', 7000000);

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
    config()->set('poofmq.admin_emails', [$user->email]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();

    expect($response->inertiaProps('admin.observability.metrics'))->toBe([
        'throughput_total' => 220,
        'error_rate_percent' => 2.73,
        'avg_push_latency_ms' => 42.5,
        'avg_pop_latency_ms' => 35.1,
        'redis_memory_bytes' => 7340032,
    ])->and(collect($response->inertiaProps('admin.observability.alerts'))->pluck('key')->all())->toBe([
        'error_rate_percent',
        'push_latency_ms',
        'pop_latency_ms',
        'redis_memory_bytes',
    ]);
});
