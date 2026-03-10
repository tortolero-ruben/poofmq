<?php

use Inertia\Testing\AssertableInertia as Assert;

it('renders the welcome page with the donation url prop', function () {
    config()->set('services.donations.donation_url', 'https://ko-fi.com/poofmq');

    $this->get('/')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->where('donationUrl', 'https://ko-fi.com/poofmq')
            ->etc());
});
