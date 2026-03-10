<?php

use App\Models\DonationLedgerEntry;
use App\Models\RailwayBillingSnapshot;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the public funding page with funding and billing props', function () {
    config()->set('services.donations.donation_url', 'https://ko-fi.com/poofmq');

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

    $this->get(route('funding.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('funding/index')
            ->where('donationUrl', 'https://ko-fi.com/poofmq')
            ->where('funding.summary.net_funding_cents', 1200)
            ->where('billing.latest.workspace_current_spend_cents', 450)
            ->where('billing.latest.poofmq_attributed_estimated_spend_cents', 720)
            ->has('billing.snapshots')
            ->etc());
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
