<?php

use App\Jobs\SyncApiKeyToRedis;
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

test('sync api key to redis stores key data with correct format', function () {
    $user = User::factory()->create();
    $apiKey = ApiKey::factory()->create(['user_id' => $user->id]);

    $redisMock = Mockery::mock();
    $redisMock->shouldReceive('setex')
        ->once()
        ->withArgs(function ($key, $ttl, $data) use ($apiKey) {
            expect($key)->toBe("poofmq:v1:auth:apikey:{$apiKey->key_prefix}")
                ->and($ttl)->toBeGreaterThan(0)
                ->and($ttl)->toBe(31536300); // 1 year + 300 buffer

            $decoded = json_decode($data, true);
            expect($decoded)->toBe([
                'key_hash' => $apiKey->key_hash,
                'user_id' => $apiKey->user_id,
                'expires_at' => null,
            ]);

            return true;
        });

    Redis::shouldReceive('connection->client')->andReturn($redisMock);

    Log::shouldReceive('info')
        ->once()
        ->with('API key synced to Redis', Mockery::any());

    $job = new SyncApiKeyToRedis(
        apiKeyId: $apiKey->id,
        keyPrefix: $apiKey->key_prefix,
        keyHash: $apiKey->key_hash,
        userId: $apiKey->user_id,
        expiresAtTimestamp: null
    );

    $job->handle();
});

test('sync api key to redis calculates ttl with expiration date', function () {
    $user = User::factory()->create();
    $expiresAt = now()->addDays(30);
    $apiKey = ApiKey::factory()->create([
        'user_id' => $user->id,
        'expires_at' => $expiresAt,
    ]);

    $redisMock = Mockery::mock();
    $redisMock->shouldReceive('setex')
        ->once()
        ->withArgs(function ($key, $ttl, $data) use ($expiresAt) {
            $expectedTtl = ($expiresAt->timestamp - now()->timestamp) + 300;
            // Allow 2 second variance for test execution time
            expect($ttl)->toBeGreaterThanOrEqual($expectedTtl - 2)
                ->and($ttl)->toBeLessThanOrEqual($expectedTtl + 2);

            $decoded = json_decode($data, true);
            expect($decoded['expires_at'])->toBe($expiresAt->timestamp);

            return true;
        });

    Redis::shouldReceive('connection->client')->andReturn($redisMock);

    Log::shouldReceive('info')
        ->once()
        ->with('API key synced to Redis', Mockery::any());

    $job = new SyncApiKeyToRedis(
        apiKeyId: $apiKey->id,
        keyPrefix: $apiKey->key_prefix,
        keyHash: $apiKey->key_hash,
        userId: $apiKey->user_id,
        expiresAtTimestamp: $expiresAt->timestamp
    );

    $job->handle();
});

test('sync api key to redis logs error on failure', function () {
    $user = User::factory()->create();
    $apiKey = ApiKey::factory()->create(['user_id' => $user->id]);

    $redisMock = Mockery::mock();
    $redisMock->shouldReceive('setex')
        ->once()
        ->andThrow(new RuntimeException('Redis connection failed'));

    Redis::shouldReceive('connection->client')->andReturn($redisMock);

    Log::shouldReceive('error')
        ->once()
        ->with('Failed to sync API key to Redis', Mockery::subset([
            'key_prefix' => $apiKey->key_prefix,
            'user_id' => $apiKey->user_id,
        ]));

    Log::shouldReceive('info')->never();

    $job = new SyncApiKeyToRedis(
        apiKeyId: $apiKey->id,
        keyPrefix: $apiKey->key_prefix,
        keyHash: $apiKey->key_hash,
        userId: $apiKey->user_id,
        expiresAtTimestamp: null
    );

    expect(fn () => $job->handle())->toThrow(RuntimeException::class);
});

test('sync api key to redis has correct retry configuration', function () {
    $job = new SyncApiKeyToRedis(
        apiKeyId: 'test-id',
        keyPrefix: 'testprefix',
        keyHash: 'testhash',
        userId: 1,
        expiresAtTimestamp: null
    );

    expect($job->tries)->toBe(3)
        ->and($job->backoff)->toBe([5, 30, 60]);
});

test('sync api key to redis has correct tags', function () {
    $job = new SyncApiKeyToRedis(
        apiKeyId: 'api-key-123',
        keyPrefix: 'testprefix',
        keyHash: 'testhash',
        userId: 42,
        expiresAtTimestamp: null
    );

    expect($job->tags())->toBe([
        'api_key:api-key-123',
        'user:42',
    ]);
});

test('sync api key to redis ensures minimum ttl of 60 seconds for expired keys', function () {
    $user = User::factory()->create();
    // Create a key that expired 500 seconds ago (more than the 300 second buffer)
    // This will result in a negative calculated TTL, which should be clamped to 60
    $expiresAt = now()->subSeconds(500);
    $apiKey = ApiKey::factory()->create([
        'user_id' => $user->id,
        'expires_at' => $expiresAt,
    ]);

    $redisMock = Mockery::mock();
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
        ->with('API key synced to Redis', Mockery::any());

    $job = new SyncApiKeyToRedis(
        apiKeyId: $apiKey->id,
        keyPrefix: $apiKey->key_prefix,
        keyHash: $apiKey->key_hash,
        userId: $apiKey->user_id,
        expiresAtTimestamp: $expiresAt->timestamp
    );

    $job->handle();
});
