<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('renders sprint 6 dashboard panels without javascript errors', function () {
    config()->set('services.donations.donation_url', 'https://ko-fi.com/poofmq');

    $user = User::factory()->create();

    $this->actingAs($user);

    visit('/dashboard')
        ->assertSee('Funding overview')
        ->assertSee('Net funding')
        ->assertSee('Support me on Ko-fi')
        ->assertNoJavaScriptErrors();
});
