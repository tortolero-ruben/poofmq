<?php

use App\Models\RailwayBillingSnapshot;
use App\Models\User;

it('includes latest railway billing snapshot and runway trend in dashboard props', function () {
    config()->set('poofmq_capacity.monthly_budget_cents', 500);

    $user = User::factory()->create();

    RailwayBillingSnapshot::factory()->create([
        'balance_cents' => 1800,
        'month_to_date_spend_cents' => 400,
        'runway_months' => 3.6,
        'captured_at' => now()->subDay(),
    ]);

    RailwayBillingSnapshot::factory()->create([
        'balance_cents' => 2500,
        'month_to_date_spend_cents' => 550,
        'runway_months' => 5.0,
        'captured_at' => now(),
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();

    expect($response->inertiaProps('billing.latest.balance_cents'))->toBe(2500)
        ->and($response->inertiaProps('billing.latest.month_to_date_spend_cents'))->toBe(550)
        ->and($response->inertiaProps('billing.latest.runway_months'))->toBe(5)
        ->and($response->inertiaProps('billing.trend.balance_delta_cents'))->toBe(700)
        ->and($response->inertiaProps('billing.trend.spend_delta_cents'))->toBe(150);
});
