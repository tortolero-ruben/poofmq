<?php

use App\Models\RailwayBillingSnapshot;
use App\Services\ObservabilityService;

it('keeps baseline monthly budget assumptions at or below five dollars', function () {
    expect((int) config('poofmq_capacity.monthly_budget_cents'))->toBeLessThanOrEqual(500);
});

it('calculates a non-zero burn rate from latest billing evidence', function () {
    RailwayBillingSnapshot::factory()->create([
        'month_to_date_spend_cents' => 300,
        'captured_at' => now()->setDay(10),
    ]);

    $metrics = app(ObservabilityService::class)->collect()['metrics'];

    expect($metrics['burn_rate_cents_per_day'])->toBe(30.0);
});
