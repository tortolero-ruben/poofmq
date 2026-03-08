<?php

use App\Models\DonationLedgerEntry;
use App\Models\RailwayBillingSnapshot;
use App\Models\User;

it('renders the public funding page with funding and billing props', function () {
    DonationLedgerEntry::factory()->create([
        'provider_event_id' => 'evt_public',
        'event_type' => 'donation_received',
        'amount_cents' => 1200,
    ]);

    RailwayBillingSnapshot::factory()->create([
        'current_spend_cents' => 450,
        'estimated_spend_cents' => 900,
        'poofmq_attributed_current_spend_cents' => 390,
        'poofmq_attributed_estimated_spend_cents' => 720,
        'funding_gap_cents' => 0,
    ]);

    $response = $this->get(route('funding.index'));

    $response->assertOk();

    expect($response->inertiaProps('funding.summary.net_funding_cents'))->toBe(1200)
        ->and($response->inertiaProps('billing.latest.workspace_current_spend_cents'))->toBe(450)
        ->and($response->inertiaProps('billing.latest.poofmq_attributed_estimated_spend_cents'))->toBe(720);
});

it('allows the configured admin user to open the admin funding page', function () {
    RailwayBillingSnapshot::factory()->create();

    $response = $this->actingAs(User::factory()->create([
        'email' => 'rubentortolero@gmail.com',
    ]))->get(route('funding.admin'));

    $response->assertOk();
    expect($response->inertiaProps('funding.history'))->toBeArray()
        ->and($response->inertiaProps('billing.latest.breakdown.current_usage'))->toBeArray()
        ->and($response->inertiaProps('billing.latest.breakdown.workspace_usage'))->toBeArray();
});

it('forbids non-admin users from the admin funding page', function () {
    $response = $this->actingAs(User::factory()->create())->get(route('funding.admin'));

    $response->assertForbidden();
});
