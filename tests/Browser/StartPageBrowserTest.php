<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('renders the start page without javascript errors', function () {
    config()->set('services.turnstile.site_key', '1x00000000000000000000AA');

    visit('/start')
        ->assertSee('Start Instantly')
        ->assertSee('Create a free queue and start pushing messages right away')
        ->assertNoJavaScriptErrors();
});
