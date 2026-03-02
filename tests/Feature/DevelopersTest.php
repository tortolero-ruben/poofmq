<?php

use App\Models\User;

test('unauthenticated users cannot view developers page', function () {
    $response = $this->get(route('developers.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated users can view developers page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('developers.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('developers'));
});
