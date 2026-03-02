<?php

use App\Models\ActiveMonthBoost;
use App\Services\CapacityLimitService;

it('keeps baseline global limit when boost feature is disabled', function () {
    config()->set('poofmq_capacity.base_global_limit_per_minute', 60);
    config()->set('poofmq_capacity.active_month_boost_enabled', false);

    ActiveMonthBoost::factory()->create([
        'multiplier' => 3,
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHour(),
    ]);

    $limits = app(CapacityLimitService::class)->resolveGlobalLimit();

    expect($limits['base_limit_per_minute'])->toBe(60)
        ->and($limits['effective_limit_per_minute'])->toBe(60)
        ->and($limits['is_boost_active'])->toBeFalse();
});

it('applies active month boost override when enabled and active', function () {
    config()->set('poofmq_capacity.base_global_limit_per_minute', 60);
    config()->set('poofmq_capacity.active_month_boost_enabled', true);

    ActiveMonthBoost::factory()->create([
        'multiplier' => 2,
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHours(2),
    ]);

    $limits = app(CapacityLimitService::class)->resolveGlobalLimit();

    expect($limits['base_limit_per_minute'])->toBe(60)
        ->and($limits['effective_limit_per_minute'])->toBe(120)
        ->and($limits['is_boost_active'])->toBeTrue()
        ->and($limits['boost_multiplier'])->toBe(2)
        ->and($limits['boost_expires_at'])->not->toBeNull();
});

it('ignores expired boost records', function () {
    config()->set('poofmq_capacity.base_global_limit_per_minute', 60);
    config()->set('poofmq_capacity.active_month_boost_enabled', true);

    ActiveMonthBoost::factory()->create([
        'multiplier' => 4,
        'starts_at' => now()->subDays(2),
        'ends_at' => now()->subMinute(),
    ]);

    $limits = app(CapacityLimitService::class)->resolveGlobalLimit();

    expect($limits['effective_limit_per_minute'])->toBe(60)
        ->and($limits['is_boost_active'])->toBeFalse();
});
