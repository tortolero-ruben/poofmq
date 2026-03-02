<?php

use App\Jobs\ReconcileApiKeysToRedis;
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

test('reconciliation syncs active api keys to redis', function () {
    $user = User::factory()->create();
    $activeKey = ApiKey::factory()->create(['user_id' => $user->id]);
    $expiredKey = ApiKey::factory()->expired()->create(['user_id' => $user->id]);
    $revokedKey = ApiKey::factory()->revoked()->create(['user_id' => $user->id]);

    $redisMock = Mockery::mock();
    $redisMock->shouldReceive('setex')
        ->once()
        ->withArgs(function ($key, $ttl, $data) use ($activeKey) {
            expect($key)->toBe("poofmq:v1:auth:apikey:{$activeKey->key_prefix}")
                ->and($ttl)->toBe(31536300);

            $decoded = json_decode($data, true);
            expect($decoded)->toBe([
                'key_hash' => $activeKey->key_hash,
                'user_id' => $activeKey->user_id,
                'expires_at' => null,
            ]);

            return true;
        });

    // Scan should return no existing keys for this test
    $redisMock->shouldReceive('scan')
        ->once()
        ->andReturnUsing(function (&$iterator) {
            $iterator = 0;

            return false;
        });

    Redis::shouldReceive('connection->client')->andReturn($redisMock);

    Log::shouldReceive('info')
        ->once()
        ->with('API key reconciliation started');

    Log::shouldReceive('info')
        ->once()
        ->with('API key reconciliation completed', [
            'total_keys' => 1,
            'synced' => 1,
            'deleted' => 0,
            'errors' => 0,
        ]);

    $job = new ReconcileApiKeysToRedis;
    $job->handle();
});

test('reconciliation syncs api keys with expiration dates', function () {
    $user = User::factory()->create();
    $expiresAt = now()->addDays(30);
    $activeKey = ApiKey::factory()->create([
        'user_id' => $user->id,
        'expires_at' => $expiresAt,
    ]);

    $redisMock = Mockery::mock();
    $redisMock->shouldReceive('setex')
        ->once()
        ->withArgs(function ($key, $ttl, $data) use ($expiresAt) {
            $expectedTtl = ($expiresAt->timestamp - now()->timestamp) + 300;
            expect($ttl)->toBeGreaterThanOrEqual($expectedTtl - 2)
                ->and($ttl)->toBeLessThanOrEqual($expectedTtl + 2);

            $decoded = json_decode($data, true);
            expect($decoded['expires_at'])->toBe($expiresAt->timestamp);

            return true;
        });

    $redisMock->shouldReceive('scan')
        ->once()
        ->andReturnUsing(function (&$iterator) {
            $iterator = 0;

            return false;
        });

    Redis::shouldReceive('connection->client')->andReturn($redisMock);

    Log::shouldReceive('info')->twice();

    $job = new ReconcileApiKeysToRedis;
    $job->handle();
});

test('reconciliation deletes orphaned keys from redis', function () {
    $user = User::factory()->create();

    // Create a revoked key that should NOT be in Redis
    $revokedKey = ApiKey::factory()->revoked()->create(['user_id' => $user->id]);

    $orphanedKeyPrefix = 'orphan01';
    $orphanedRedisKey = "poofmq:v1:auth:apikey:{$orphanedKeyPrefix}";

    $redisMock = Mockery::mock();

    // No active keys to sync
    $redisMock->shouldReceive('setex')->never();

    // Scan returns an orphaned key
    $scanCallCount = 0;
    $redisMock->shouldReceive('scan')
        ->andReturnUsing(function (&$iterator) use ($orphanedRedisKey, &$scanCallCount) {
            $scanCallCount++;
            if ($scanCallCount === 1) {
                $iterator = 0;

                return [$orphanedRedisKey];
            }
            $iterator = 0;

            return false;
        });

    // Should delete the orphaned key
    $redisMock->shouldReceive('del')
        ->once()
        ->with($orphanedRedisKey);

    Redis::shouldReceive('connection->client')->andReturn($redisMock);

    Log::shouldReceive('info')->byDefault();
    Log::shouldReceive('info')
        ->once()
        ->with('Removed orphaned API key from Redis', [
            'key_prefix' => $orphanedKeyPrefix,
            'redis_key' => $orphanedRedisKey,
        ]);

    Log::shouldReceive('info')
        ->once()
        ->with('API key reconciliation completed', [
            'total_keys' => 0,
            'synced' => 0,
            'deleted' => 1,
            'errors' => 0,
        ]);

    $job = new ReconcileApiKeysToRedis;
    $job->handle();
});

test('reconciliation keeps active keys in redis', function () {
    $user = User::factory()->create();
    $activeKey = ApiKey::factory()->create(['user_id' => $user->id]);

    $activeRedisKey = "poofmq:v1:auth:apikey:{$activeKey->key_prefix}";

    $redisMock = Mockery::mock();

    // Sync the active key
    $redisMock->shouldReceive('setex')
        ->once()
        ->withArgs(function ($key) use ($activeKey) {
            return $key === "poofmq:v1:auth:apikey:{$activeKey->key_prefix}";
        });

    // Scan returns the active key
    $scanCallCount = 0;
    $redisMock->shouldReceive('scan')
        ->andReturnUsing(function (&$iterator) use ($activeRedisKey, &$scanCallCount) {
            $scanCallCount++;
            if ($scanCallCount === 1) {
                $iterator = 0;

                return [$activeRedisKey];
            }
            $iterator = 0;

            return false;
        });

    // Should NOT delete the active key
    $redisMock->shouldReceive('del')->never();

    Redis::shouldReceive('connection->client')->andReturn($redisMock);

    Log::shouldReceive('info')->byDefault();
    Log::shouldReceive('info')
        ->once()
        ->with('API key reconciliation completed', [
            'total_keys' => 1,
            'synced' => 1,
            'deleted' => 0,
            'errors' => 0,
        ]);

    $job = new ReconcileApiKeysToRedis;
    $job->handle();
});

test('reconciliation logs errors for failed syncs', function () {
    $user = User::factory()->create();
    $activeKey = ApiKey::factory()->create(['user_id' => $user->id]);

    $redisMock = Mockery::mock();
    $redisMock->shouldReceive('setex')
        ->once()
        ->andThrow(new RuntimeException('Redis connection failed'));

    $redisMock->shouldReceive('scan')
        ->once()
        ->andReturnUsing(function (&$iterator) {
            $iterator = 0;

            return false;
        });

    Redis::shouldReceive('connection->client')->andReturn($redisMock);

    Log::shouldReceive('info')->byDefault();
    Log::shouldReceive('error')
        ->once()
        ->with('Failed to reconcile API key', Mockery::subset([
            'api_key_id' => $activeKey->id,
            'key_prefix' => $activeKey->key_prefix,
        ]));

    Log::shouldReceive('info')
        ->once()
        ->with('API key reconciliation completed', [
            'total_keys' => 1,
            'synced' => 0,
            'deleted' => 0,
            'errors' => 1,
        ]);

    $job = new ReconcileApiKeysToRedis;
    $job->handle();
});

test('reconciliation logs errors for failed deletes', function () {
    $orphanedKeyPrefix = 'orphan01';
    $orphanedRedisKey = "poofmq:v1:auth:apikey:{$orphanedKeyPrefix}";

    $redisMock = Mockery::mock();

    // No active keys to sync
    $redisMock->shouldReceive('setex')->never();

    // Scan returns an orphaned key
    $scanCallCount = 0;
    $redisMock->shouldReceive('scan')
        ->andReturnUsing(function (&$iterator) use ($orphanedRedisKey, &$scanCallCount) {
            $scanCallCount++;
            if ($scanCallCount === 1) {
                $iterator = 0;

                return [$orphanedRedisKey];
            }
            $iterator = 0;

            return false;
        });

    // Delete fails
    $redisMock->shouldReceive('del')
        ->once()
        ->with($orphanedRedisKey)
        ->andThrow(new RuntimeException('Redis delete failed'));

    Redis::shouldReceive('connection->client')->andReturn($redisMock);

    Log::shouldReceive('info')->byDefault();
    Log::shouldReceive('error')
        ->once()
        ->with('Failed to delete orphaned API key from Redis', Mockery::subset([
            'key_prefix' => $orphanedKeyPrefix,
            'redis_key' => $orphanedRedisKey,
        ]));

    Log::shouldReceive('info')
        ->once()
        ->with('API key reconciliation completed', [
            'total_keys' => 0,
            'synced' => 0,
            'deleted' => 0,
            'errors' => 1,
        ]);

    $job = new ReconcileApiKeysToRedis;
    $job->handle();
});

test('reconciliation has correct tags', function () {
    $job = new ReconcileApiKeysToRedis;

    expect($job->tags())->toBe([
        'reconciliation',
        'api_keys',
    ]);
});

test('reconciliation handles scan errors gracefully', function () {
    $redisMock = Mockery::mock();

    // No active keys to sync
    $redisMock->shouldReceive('setex')->never();

    // Scan throws an error
    $redisMock->shouldReceive('scan')
        ->once()
        ->andThrow(new RuntimeException('Redis scan failed'));

    Redis::shouldReceive('connection->client')->andReturn($redisMock);

    Log::shouldReceive('info')->byDefault();
    Log::shouldReceive('error')
        ->once()
        ->with('Failed to scan Redis keys during reconciliation', Mockery::type('array'));

    Log::shouldReceive('info')
        ->once()
        ->with('API key reconciliation completed', [
            'total_keys' => 0,
            'synced' => 0,
            'deleted' => 0,
            'errors' => 1,
        ]);

    $job = new ReconcileApiKeysToRedis;
    $job->handle();
});

test('reconciliation ensures minimum ttl of 60 seconds for keys near expiration', function () {
    $user = User::factory()->create();
    // Create a key that expires in 100 seconds (less than buffer, so TTL would be negative without clamping)
    $expiresAt = now()->addSeconds(100);
    $activeKey = ApiKey::factory()->create([
        'user_id' => $user->id,
        'expires_at' => $expiresAt,
    ]);

    $redisMock = Mockery::mock();
    $redisMock->shouldReceive('setex')
        ->once()
        ->withArgs(function ($key, $ttl, $data) {
            // Even with the skew buffer, a very short expiration should still give at least 60 seconds
            expect($ttl)->toBeGreaterThanOrEqual(60);

            return true;
        });

    $redisMock->shouldReceive('scan')
        ->once()
        ->andReturnUsing(function (&$iterator) {
            $iterator = 0;

            return false;
        });

    Redis::shouldReceive('connection->client')->andReturn($redisMock);

    Log::shouldReceive('info')->twice();

    $job = new ReconcileApiKeysToRedis;
    $job->handle();
});
