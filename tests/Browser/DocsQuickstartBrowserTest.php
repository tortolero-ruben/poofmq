<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('renders the public docs quickstart page without javascript errors', function () {
    config()->set('services.donations.donation_url', 'https://ko-fi.com/poofmq');

    visit('/docs/quickstart')
        ->assertSee('Quickstart')
        ->assertSee('Preview the queue workflow over plain HTTP.')
        ->assertSee('Sign in')
        ->assertNoJavaScriptErrors();
});
