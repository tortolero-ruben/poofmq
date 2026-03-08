<?php

use App\Models\DonationLedgerEntry;
use App\Models\RailwayBillingSnapshot;
use App\Models\User;

it('includes latest railway funding snapshot and trend in dashboard props', function () {
    $user = User::factory()->create();

    DonationLedgerEntry::factory()->create([
        'provider_event_id' => 'evt_dashboard',
        'event_type' => 'donation_received',
        'amount_cents' => 900,
    ]);

    RailwayBillingSnapshot::factory()->create([
        'current_spend_cents' => 400,
        'estimated_spend_cents' => 650,
        'poofmq_attributed_current_spend_cents' => 300,
        'poofmq_attributed_estimated_spend_cents' => 500,
        'funding_gap_cents' => 100,
        'runway_months' => 3.6,
        'captured_at' => now()->subDay(),
    ]);

    RailwayBillingSnapshot::factory()->create([
        'current_spend_cents' => 550,
        'estimated_spend_cents' => 900,
        'poofmq_attributed_current_spend_cents' => 450,
        'poofmq_attributed_estimated_spend_cents' => 700,
        'funding_gap_cents' => 0,
        'runway_months' => 5.0,
        'captured_at' => now(),
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();

    expect($response->inertiaProps('billing.latest.workspace_current_spend_cents'))->toBe(550)
        ->and($response->inertiaProps('billing.latest.poofmq_attributed_estimated_spend_cents'))->toBe(700)
        ->and($response->inertiaProps('billing.latest.runway_months'))->toBe(5)
        ->and($response->inertiaProps('billing.trend.workspace_current_spend_delta_cents'))->toBe(150)
        ->and($response->inertiaProps('billing.trend.poofmq_attributed_estimated_spend_delta_cents'))->toBe(200)
        ->and($response->inertiaProps('billing.trend.funding_gap_delta_cents'))->toBe(-100);
});
