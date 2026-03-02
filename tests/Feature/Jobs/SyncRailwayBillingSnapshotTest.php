<?php

use App\Jobs\SyncRailwayBillingSnapshot;
use App\Models\RailwayBillingSnapshot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    config()->set('services.railway.api_token', 'railway-test-token');
    config()->set('services.railway.project_id', 'proj_123');
    config()->set('services.railway.billing_endpoint', 'https://railway.example.test/v1/billing/summary');
    config()->set('poofmq_capacity.monthly_budget_cents', 500);
});

it('syncs latest railway billing snapshot and computes runway months', function () {
    Http::fake([
        'https://railway.example.test/v1/billing/summary*' => Http::response([
            'balance_cents' => 2750,
            'month_to_date_spend_cents' => 550,
            'captured_at' => now()->toIso8601String(),
        ], 200),
    ]);

    $job = new SyncRailwayBillingSnapshot;
    $this->app->call([$job, 'handle']);

    $snapshot = RailwayBillingSnapshot::query()->latest('captured_at')->first();

    expect($snapshot)->not->toBeNull()
        ->and($snapshot?->balance_cents)->toBe(2750)
        ->and($snapshot?->month_to_date_spend_cents)->toBe(550)
        ->and((float) $snapshot?->runway_months)->toBe(5.5);
});

it('fails fast when railway credentials are missing', function () {
    config()->set('services.railway.api_token', null);

    $job = new SyncRailwayBillingSnapshot;

    expect(fn () => $this->app->call([$job, 'handle']))
        ->toThrow(RuntimeException::class, 'Railway billing API credentials are not configured.');

    expect(RailwayBillingSnapshot::query()->count())->toBe(0);
});
