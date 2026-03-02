<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('api user endpoint returns unauthorized without token', function () {
    $response = $this->getJson('/api/user');

    $response->assertUnauthorized();
});

test('api user endpoint returns user with valid token', function () {
    $user = User::factory()->create();

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/user');

    $response->assertOk()
        ->assertJson([
            'id' => $user->id,
            'email' => $user->email,
        ]);
});

test('api user endpoint returns user with token abilities', function () {
    $user = User::factory()->create();

    Sanctum::actingAs($user, ['*']);

    $response = $this->getJson('/api/user');

    $response->assertOk()
        ->assertJson([
            'id' => $user->id,
            'email' => $user->email,
        ]);
});

test('user can create api token', function () {
    $user = User::factory()->create();

    $token = $user->createToken('test-token');

    expect($token->accessToken->name)->toBe('test-token')
        ->and($token->plainTextToken)->toBeString();
});

test('user can authenticate with api token', function () {
    $user = User::factory()->create();

    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/user');

    $response->assertOk()
        ->assertJson([
            'id' => $user->id,
            'email' => $user->email,
        ]);
});

test('user can revoke api token', function () {
    $user = User::factory()->create();

    $token = $user->createToken('test-token');

    $tokenId = $token->accessToken->id;

    $user->tokens()->where('id', $tokenId)->delete();

    $response = $this->withHeader('Authorization', 'Bearer '.$token->plainTextToken)
        ->getJson('/api/user');

    $response->assertUnauthorized();
});

test('api token abilities are checked', function () {
    $user = User::factory()->create();

    Sanctum::actingAs($user, ['view-profile']);

    $response = $this->getJson('/api/user');

    $response->assertOk();
});
