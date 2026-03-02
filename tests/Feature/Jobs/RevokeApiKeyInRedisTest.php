<?php

use App\Jobs\RevokeApiKeyInRedis;
use App\Models\ApiKey;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

beforeEach(function () {
    Config::set('poofmq.redis_namespace_root', 'poofmq:v1');
    Config::set('poofmq.redis_auth_namespace', 'auth');
    Config::set('poofmq.auth_key_ttl_skew_buffer', 300);
    Config::set('poofmq.default_auth_key_ttl', 31536000);
});

test('revoke api key in redis deletes active key and sets revocation marker', function () {
    $user = User::factory()->create();
    $apiKey = ApiKey::factory()->create(['user_id' => $user->id]);

    $redisMock = Mockery::mock();
    $redisMock->shouldReceive('del')
        ->once()
        ->with("poofmq:v1:auth:apikey:{$apiKey->key_prefix}");

    $redisMock->shouldReceive('setex')
        ->once()
        ->withArgs(function ($key, $ttl, $data) use ($apiKey) {
            expect($key)->toBe("poofmq:v1:auth:revoke:apikey:{$apiKey->key_prefix}")
                ->and($ttl)->toBe(31536300); // 1 year + 300 buffer

            $decoded = json_decode($data, true);
            expect($decoded)->toHaveKey('revoked_at')
                ->and($decoded)->toHaveKey('user_id', $apiKey->user_id);

            return true;
        });

    Redis::shouldReceive('connection->client')->andReturn($redisMock);

    Log::shouldReceive('info')
        ->once()
        ->with('API key revoked in Redis', Mockery::any());

    $job = new RevokeApiKeyInRedis(
        keyPrefix: $apiKey->key_prefix,
        userId: $apiKey->user_id,
        expiresAtTimestamp: null
    );

    $job->handle();
});

test('revoke api key in redis calculates ttl with expiration date', function () {
    $user = User::factory()->create();
    $expiresAt = now()->addDays(30);
    $apiKey = ApiKey::factory()->create([
        'user_id' => $user->id,
        'expires_at' => $expiresAt,
    ]);

    $redisMock = Mockery::mock();
    $redisMock->shouldReceive('del')
        ->once()
        ->with("poofmq:v1:auth:apikey:{$apiKey->key_prefix}");

    $redisMock->shouldReceive('setex')
        ->once()
        ->withArgs(function ($key, $ttl, $data) use ($expiresAt) {
            $expectedTtl = ($expiresAt->timestamp - now()->timestamp) + 300;
            // Allow 2 second variance for test execution time
            expect($ttl)->toBeGreaterThanOrEqual($expectedTtl - 2)
                ->and($ttl)->toBeLessThanOrEqual($expectedTtl + 2);

            return true;
        });

    Redis::shouldReceive('connection->client')->andReturn($redisMock);

    Log::shouldReceive('info')
        ->once()
        ->with('API key revoked in Redis', Mockery::any());

    $job = new RevokeApiKeyInRedis(
        keyPrefix: $apiKey->key_prefix,
        userId: $apiKey->user_id,
        expiresAtTimestamp: $expiresAt->timestamp
    );

    $job->handle();
});

test('revoke api key in redis logs error on failure', function () {
    $user = User::factory()->create();
    $apiKey = ApiKey::factory()->create(['user_id' => $user->id]);

    $redisMock = Mockery::mock();
    $redisMock->shouldReceive('del')
        ->once()
        ->andThrow(new RuntimeException('Redis connection failed'));

    Redis::shouldReceive('connection->client')->andReturn($redisMock);

    Log::shouldReceive('error')
        ->once()
        ->with('Failed to revoke API key in Redis', Mockery::subset([
            'key_prefix' => $apiKey->key_prefix,
            'user_id' => $apiKey->user_id,
        ]));

    Log::shouldReceive('info')->never();

    $job = new RevokeApiKeyInRedis(
        keyPrefix: $apiKey->key_prefix,
        userId: $apiKey->user_id,
        expiresAtTimestamp: null
    );

    expect(fn () => $job->handle())->toThrow(RuntimeException::class);
});

test('revoke api key in redis has correct retry configuration', function () {
    $job = new RevokeApiKeyInRedis(
        keyPrefix: 'testprefix',
        userId: 1,
        expiresAtTimestamp: null
    );

    expect($job->tries)->toBe(3)
        ->and($job->backoff)->toBe([5, 30, 60]);
});

test('revoke api key in redis has correct tags', function () {
    $job = new RevokeApiKeyInRedis(
        keyPrefix: 'testprefix',
        userId: 42,
        expiresAtTimestamp: null
    );

    expect($job->tags())->toBe([
        'api_key_prefix:testprefix',
        'user:42',
    ]);
});

test('revoke api key in redis ensures minimum ttl of 60 seconds for expired keys', function () {
    $user = User::factory()->create();
    // Create a key that expired 500 seconds ago (more than the 300 second buffer)
    // This will result in a negative calculated TTL, which should be clamped to 60
    $expiresAt = now()->subSeconds(500);
    $apiKey = ApiKey::factory()->create([
        'user_id' => $user->id,
        'expires_at' => $expiresAt,
    ]);

    $redisMock = Mockery::mock();
    $redisMock->shouldReceive('del')
        ->once();

    $redisMock->shouldReceive('setex')
        ->once()
        ->withArgs(function ($key, $ttl, $data) {
            // TTL should be the minimum of 60 seconds since the key is already expired
            // and the calculated TTL would be negative
            expect($ttl)->toBe(60);

            return true;
        });

    Redis::shouldReceive('connection->client')->andReturn($redisMock);

    Log::shouldReceive('info')
        ->once()
        ->with('API key revoked in Redis', Mockery::any());

    $job = new RevokeApiKeyInRedis(
        keyPrefix: $apiKey->key_prefix,
        userId: $apiKey->user_id,
        expiresAtTimestamp: $expiresAt->timestamp
    );

    $job->handle();
});
