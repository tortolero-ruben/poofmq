<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    config()->set('services.donations.donation_url', 'https://ko-fi.com/poofmq');

    $user = User::factory()->create();
    $this->actingAs($user);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('donationUrl', 'https://ko-fi.com/poofmq')
            ->has('funding.summary')
            ->has('billing')
            ->etc());
});
