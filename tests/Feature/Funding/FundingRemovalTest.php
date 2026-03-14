<?php

use App\Models\User;

test('legacy funding routes redirect to the dashboard entry point', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('funding.index'))
        ->assertRedirect(route('dashboard', absolute: false));

    $this->actingAs($user)
        ->get(route('funding.admin'))
        ->assertRedirect(route('dashboard', absolute: false));
});

test('legacy donation webhook endpoint is a no-op compatibility sink', function () {
    $this->postJson(route('api.donations.webhooks.store'), [
        'event' => 'donation.created',
    ])->assertNoContent();
});
