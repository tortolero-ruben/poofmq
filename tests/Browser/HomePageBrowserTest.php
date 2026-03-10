<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('renders the home page donation call to action without javascript errors', function () {
    $visitFunction = 'Pest\\Browser\\visit';
    if (! function_exists($visitFunction)) {
        $this->markTestSkipped('pest-plugin-browser is not installed in this environment.');
    }

    config()->set('services.donations.donation_url', 'https://ko-fi.com/poofmq');

    $visitFunction('/')
        ->assertSee('Use Cases')
        ->assertSee('Event buffering')
        ->assertNoJavaScriptErrors();
});
