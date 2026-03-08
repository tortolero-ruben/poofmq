<?php

use App\Models\RailwayBillingSnapshot;
use App\Models\User;

it('marks stale funding data in dashboard props when the latest snapshot is too old', function () {
    config()->set('observability.thresholds.railway_snapshot_max_age_minutes', 30);

    RailwayBillingSnapshot::factory()->create([
        'captured_at' => now()->subHours(3),
    ]);

    $response = $this->actingAs(User::factory()->create())->get(route('dashboard'));

    $response->assertOk();

    expect($response->inertiaProps('billing.is_stale'))->toBeTrue()
        ->and($response->inertiaProps('billing.snapshot_age_minutes'))->toBeGreaterThan(30);
});
