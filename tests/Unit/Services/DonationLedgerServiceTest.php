<?php

use App\Models\DonationLedgerEntry;
use App\Services\DonationLedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('calculates aggregate donation totals deterministically', function () {
    DonationLedgerEntry::factory()->create([
        'event_type' => 'donation_received',
        'amount_cents' => 1000,
        'currency' => 'USD',
    ]);

    DonationLedgerEntry::factory()->create([
        'event_type' => 'donation_received',
        'amount_cents' => 400,
        'currency' => 'USD',
    ]);

    DonationLedgerEntry::factory()->create([
        'event_type' => 'refund_issued',
        'amount_cents' => -250,
        'currency' => 'USD',
    ]);

    $summary = app(DonationLedgerService::class)->summary();

    expect($summary)->toBe([
        'gross_donations_cents' => 1400,
        'refunds_cents' => 250,
        'net_funding_cents' => 1150,
        'event_count' => 3,
    ]);
});

it('returns newest ledger entries first for portal history', function () {
    $older = DonationLedgerEntry::factory()->create([
        'provider_event_id' => 'evt_old',
        'happened_at' => now()->subDay(),
    ]);

    $newer = DonationLedgerEntry::factory()->create([
        'provider_event_id' => 'evt_new',
        'happened_at' => now(),
    ]);

    $history = app(DonationLedgerService::class)->recentEntries(limit: 10);

    expect($history)->toHaveCount(2)
        ->and($history[0]['id'])->toBe($newer->id)
        ->and($history[1]['id'])->toBe($older->id);
});
