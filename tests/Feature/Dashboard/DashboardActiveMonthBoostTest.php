<?php

use App\Models\ActiveMonthBoost;
use App\Models\User;

it('includes active month boost visibility in dashboard props', function () {
    config()->set('poofmq_capacity.base_global_limit_per_minute', 60);
    config()->set('poofmq_capacity.active_month_boost_enabled', true);

    $user = User::factory()->create();
    config()->set('poofmq.admin_emails', [$user->email]);

    ActiveMonthBoost::factory()->create([
        'multiplier' => 3,
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHours(6),
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();

    expect($response->inertiaProps('admin.capacity.base_limit_per_minute'))->toBe(60)
        ->and($response->inertiaProps('admin.capacity.effective_limit_per_minute'))->toBe(180)
        ->and($response->inertiaProps('admin.capacity.is_boost_active'))->toBeTrue()
        ->and($response->inertiaProps('admin.capacity.boost_multiplier'))->toBe(3)
        ->and($response->inertiaProps('admin.capacity.boost_expires_at'))->not->toBeNull();
});
