<?php

use App\Models\DonationLedgerEntry;
use App\Models\User;

it('includes donation funding summary and history in dashboard props', function () {
    $user = User::factory()->create();

    DonationLedgerEntry::factory()->create([
        'provider_event_id' => 'evt_1',
        'event_type' => 'donation_received',
        'amount_cents' => 900,
        'happened_at' => now()->subHour(),
    ]);

    DonationLedgerEntry::factory()->create([
        'provider_event_id' => 'evt_2',
        'event_type' => 'refund_issued',
        'amount_cents' => -200,
        'happened_at' => now(),
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    expect($response->inertiaProps('funding.summary.gross_donations_cents'))->toBe(900)
        ->and($response->inertiaProps('funding.summary.refunds_cents'))->toBe(200)
        ->and($response->inertiaProps('funding.summary.net_funding_cents'))->toBe(700)
        ->and($response->inertiaProps('funding.history'))->toHaveCount(2);
});
