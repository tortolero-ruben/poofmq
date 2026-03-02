<?php

use App\Models\DonationLedgerEntry;

use function Pest\Laravel\postJson;

beforeEach(function () {
    config()->set('services.donations.webhook_secret', 'test-donation-secret');
});

it('ingests a signed donation webhook event', function () {
    $payload = [
        'provider' => 'github_sponsors',
        'provider_event_id' => 'evt_12345',
        'event_type' => 'donation_received',
        'amount_cents' => 700,
        'currency' => 'USD',
        'happened_at' => now()->toIso8601String(),
        'donor_name' => 'Ada Lovelace',
        'metadata' => ['source' => 'sponsors'],
    ];

    $signature = hash_hmac('sha256', json_encode($payload, JSON_THROW_ON_ERROR), 'test-donation-secret');

    $response = postJson(route('api.donations.webhooks.store'), $payload, [
        'X-PoofMQ-Signature' => $signature,
    ]);

    $response->assertCreated()
        ->assertJsonPath('already_processed', false)
        ->assertJsonPath('entry.provider_event_id', 'evt_12345');

    expect(DonationLedgerEntry::query()->count())->toBe(1)
        ->and(DonationLedgerEntry::query()->first()?->amount_cents)->toBe(700);
});

it('processes donation webhooks idempotently by provider event id', function () {
    $payload = [
        'provider' => 'github_sponsors',
        'provider_event_id' => 'evt_12345',
        'event_type' => 'donation_received',
        'amount_cents' => 500,
        'currency' => 'USD',
        'happened_at' => now()->toIso8601String(),
    ];

    $signature = hash_hmac('sha256', json_encode($payload, JSON_THROW_ON_ERROR), 'test-donation-secret');

    postJson(route('api.donations.webhooks.store'), $payload, [
        'X-PoofMQ-Signature' => $signature,
    ])->assertCreated();

    postJson(route('api.donations.webhooks.store'), $payload, [
        'X-PoofMQ-Signature' => $signature,
    ])->assertOk()
        ->assertJsonPath('already_processed', true);

    expect(DonationLedgerEntry::query()->count())->toBe(1);
});

it('rejects unsigned or invalidly signed donation webhooks', function () {
    $payload = [
        'provider' => 'github_sponsors',
        'provider_event_id' => 'evt_unauthorized',
        'event_type' => 'donation_received',
        'amount_cents' => 100,
        'currency' => 'USD',
        'happened_at' => now()->toIso8601String(),
    ];

    postJson(route('api.donations.webhooks.store'), $payload, [
        'X-PoofMQ-Signature' => 'invalid',
    ])->assertUnauthorized();

    expect(DonationLedgerEntry::query()->count())->toBe(0);
});
