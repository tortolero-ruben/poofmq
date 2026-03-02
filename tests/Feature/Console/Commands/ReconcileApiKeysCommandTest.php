<?php

use App\Models\ApiKey;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Redis;

beforeEach(function () {
    Config::set('poofmq.redis_namespace_root', 'poofmq:v1');
    Config::set('poofmq.redis_auth_namespace', 'auth');
    Config::set('poofmq.auth_key_ttl_skew_buffer', 300);
    Config::set('poofmq.default_auth_key_ttl', 31536000);
});

test('command executes reconciliation successfully', function () {
    $user = User::factory()->create();
    $activeKey = ApiKey::factory()->create(['user_id' => $user->id]);

    $redisMock = Mockery::mock();
    $redisMock->shouldReceive('setex')
        ->once()
        ->withArgs(function ($key, $ttl, $data) use ($activeKey) {
            expect($key)->toBe("poofmq:v1:auth:apikey:{$activeKey->key_prefix}");

            return true;
        });

    $redisMock->shouldReceive('scan')
        ->once()
        ->andReturn(false);

    Redis::shouldReceive('connection')->andReturn($redisMock);

    $this->artisan('app:reconcile-api-keys')
        ->expectsOutput('Starting API key reconciliation...')
        ->expectsOutput('API key reconciliation completed.')
        ->assertSuccessful();
});

test('command handles empty database gracefully', function () {
    $redisMock = Mockery::mock();

    // No keys to sync
    $redisMock->shouldReceive('setex')->never();

    // No keys to scan
    $redisMock->shouldReceive('scan')
        ->once()
        ->andReturn(false);

    Redis::shouldReceive('connection')->andReturn($redisMock);

    $this->artisan('app:reconcile-api-keys')
        ->expectsOutput('Starting API key reconciliation...')
        ->expectsOutput('API key reconciliation completed.')
        ->assertSuccessful();
});

test('command has correct signature', function () {
    $command = new \App\Console\Commands\ReconcileApiKeysCommand;

    expect($command->getName())->toBe('app:reconcile-api-keys');
});
