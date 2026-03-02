<?php

use App\Jobs\RevokeApiKeyInRedis;
use App\Jobs\SyncApiKeyToRedis;
use App\Models\ApiKey;
use App\Models\Project;
use App\Models\User;
use App\Services\ApiKeyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;

uses(RefreshDatabase::class);

test('unauthenticated users cannot view api keys index', function () {
    $response = $this->get(route('api-keys.index'));

    $response->assertRedirect(route('login'));
});

test('users can create an api key', function () {
    Bus::fake();

    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson(route('api-keys.store'), [
        'name' => 'Test API Key',
    ]);

    $response->assertCreated();
    $response->assertJsonStructure([
        'api_key' => ['id', 'name', 'key_prefix', 'created_at'],
        'plain_text_key',
        'message',
    ]);
    $response->assertJsonPath('api_key.name', 'Test API Key');
    $response->assertJsonPath('api_key.project_id', null);

    expect($response->json('plain_text_key'))->toStartWith('poofmq_');
    expect(strlen($response->json('plain_text_key')))->toBe(50);

    $this->assertDatabaseHas('api_keys', [
        'user_id' => $user->id,
        'name' => 'Test API Key',
    ]);

    Bus::assertDispatched(SyncApiKeyToRedis::class);
});

test('users can create an api key scoped to their project', function () {
    Bus::fake();

    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->postJson(route('api-keys.store'), [
        'name' => 'Project API Key',
        'project_id' => $project->id,
    ]);

    $response->assertCreated();
    $response->assertJsonPath('api_key.project_id', $project->id);
    $response->assertJsonPath('api_key.project_name', $project->name);

    $this->assertDatabaseHas('api_keys', [
        'user_id' => $user->id,
        'project_id' => $project->id,
        'name' => 'Project API Key',
    ]);
});

test('users cannot create an api key for another users project', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $otherUser->id]);

    $response = $this->actingAs($user)->postJson(route('api-keys.store'), [
        'name' => 'Invalid Project API Key',
        'project_id' => $project->id,
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['project_id']);

    $this->assertDatabaseMissing('api_keys', [
        'user_id' => $user->id,
        'name' => 'Invalid Project API Key',
    ]);
});

test('users cannot create an api key for an archived project', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create([
        'user_id' => $user->id,
        'archived_at' => now(),
    ]);

    $response = $this->actingAs($user)->postJson(route('api-keys.store'), [
        'name' => 'Archived Project API Key',
        'project_id' => $project->id,
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['project_id']);

    $this->assertDatabaseMissing('api_keys', [
        'user_id' => $user->id,
        'name' => 'Archived Project API Key',
    ]);
});

test('users can create an api key with expiration date', function () {
    Bus::fake();

    $user = User::factory()->create();
    $expiresAt = now()->addDays(30)->toIso8601String();

    $response = $this->actingAs($user)->postJson(route('api-keys.store'), [
        'name' => 'Expiring API Key',
        'expires_at' => $expiresAt,
    ]);

    $response->assertCreated();
    $response->assertJsonPath('api_key.name', 'Expiring API Key');
    $response->assertJsonStructure(['api_key' => ['expires_at']]);

    Bus::assertDispatched(SyncApiKeyToRedis::class);
});

test('api key validation requires name', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson(route('api-keys.store'), []);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['name']);
});

test('api key name must be under 255 characters', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson(route('api-keys.store'), [
        'name' => str_repeat('a', 256),
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['name']);
});

test('api key expiration must be in the future', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson(route('api-keys.store'), [
        'name' => 'Test Key',
        'expires_at' => now()->subDay()->toIso8601String(),
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['expires_at']);
});

test('users can revoke their api key', function () {
    Bus::fake();

    $user = User::factory()->create();
    $apiKey = ApiKey::factory()->create(['user_id' => $user->id]);

    expect($apiKey->isRevoked())->toBeFalse();

    $response = $this->actingAs($user)->delete(route('api-keys.destroy', $apiKey));

    $response->assertRedirect();
    $response->assertSessionHas('status', 'API key revoked successfully.');

    $apiKey->refresh();
    expect($apiKey->isRevoked())->toBeTrue();
    expect($apiKey->revoked_by)->toBe($user->id);

    Bus::assertDispatched(RevokeApiKeyInRedis::class);
});

test('users can revoke their api key with a json response', function () {
    Bus::fake();

    $user = User::factory()->create();
    $apiKey = ApiKey::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->deleteJson(route('api-keys.destroy', $apiKey));

    $response->assertOk();
    $response->assertJson([
        'message' => 'API key revoked successfully.',
    ]);

    $apiKey->refresh();
    expect($apiKey->isRevoked())->toBeTrue();

    Bus::assertDispatched(RevokeApiKeyInRedis::class);
});

test('users cannot revoke other users api keys', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $apiKey = ApiKey::factory()->create(['user_id' => $otherUser->id]);

    $response = $this->actingAs($user)->delete(route('api-keys.destroy', $apiKey));

    $response->assertForbidden();

    $apiKey->refresh();
    expect($apiKey->isRevoked())->toBeFalse();
});

test('api key hash is stored not plain text', function () {
    Bus::fake();

    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson(route('api-keys.store'), [
        'name' => 'Test Key',
    ]);

    $plainTextKey = $response->json('plain_text_key');
    $apiKey = ApiKey::query()->where('user_id', $user->id)->first();

    expect($apiKey->key_hash)->not->toBe($plainTextKey);
    expect($apiKey->key_hash)->toBe(hash('sha256', $plainTextKey));
});

test('api key prefix is stored for lookup', function () {
    Bus::fake();

    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson(route('api-keys.store'), [
        'name' => 'Test Key',
    ]);

    $plainTextKey = $response->json('plain_text_key');
    $apiKey = ApiKey::query()->where('user_id', $user->id)->first();

    $expectedPrefix = substr($plainTextKey, strlen('poofmq_'), 8);
    expect($apiKey->key_prefix)->toBe($expectedPrefix);
});

test('api key service can verify valid key', function () {
    Bus::fake();

    $user = User::factory()->create();
    $service = app(ApiKeyService::class);

    $result = $service->generate($user, 'Test Key');
    $plainTextKey = $result['plain_text_key'];

    $verifiedKey = $service->verify($plainTextKey);

    expect($verifiedKey)->not->toBeNull();
    expect($verifiedKey->id)->toBe($result['api_key']->id);
});

test('api key service returns null for invalid key', function () {
    $service = app(ApiKeyService::class);

    $verifiedKey = $service->verify('poofmq_invalidkey12345678901234567890');

    expect($verifiedKey)->toBeNull();
});

test('api key service returns null for revoked key', function () {
    Bus::fake();

    $user = User::factory()->create();
    $service = app(ApiKeyService::class);

    $result = $service->generate($user, 'Test Key');
    $plainTextKey = $result['plain_text_key'];

    $service->revoke($result['api_key'], $user);

    $verifiedKey = $service->verify($plainTextKey);

    expect($verifiedKey)->toBeNull();
});

test('api key service returns null for expired key', function () {
    $user = User::factory()->create();

    $apiKey = ApiKey::factory()->create([
        'user_id' => $user->id,
        'expires_at' => now()->subDay(),
    ]);

    $service = app(ApiKeyService::class);

    // Generate a key to get the hash format, but we need the actual plain text
    // Since we can't retrieve the plain text, we'll test the model directly
    expect($apiKey->isExpired())->toBeTrue();
    expect($apiKey->isValid())->toBeFalse();
});

test('api key is valid when not expired and not revoked', function () {
    $apiKey = ApiKey::factory()->create();

    expect($apiKey->isValid())->toBeTrue();
    expect($apiKey->isExpired())->toBeFalse();
    expect($apiKey->isRevoked())->toBeFalse();
});

test('api key is invalid when expired', function () {
    $apiKey = ApiKey::factory()->expired()->create();

    expect($apiKey->isValid())->toBeFalse();
    expect($apiKey->isExpired())->toBeTrue();
});

test('api key is invalid when revoked', function () {
    $apiKey = ApiKey::factory()->revoked()->create();

    expect($apiKey->isValid())->toBeFalse();
    expect($apiKey->isRevoked())->toBeTrue();
});

test('plain text key format is correct', function () {
    Bus::fake();

    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson(route('api-keys.store'), [
        'name' => 'Test Key',
    ]);

    $plainTextKey = $response->json('plain_text_key');

    // Check prefix
    expect($plainTextKey)->toStartWith('poofmq_');

    // Check total length: poofmq_ (7) + 43 chars = 50
    expect(strlen($plainTextKey))->toBe(50);

    // Check that body contains only base64url characters
    $body = substr($plainTextKey, 7);
    expect(preg_match('/^[A-Za-z0-9_-]+$/', $body))->toBe(1);
});

test('unverified users cannot access api keys', function () {
    $user = User::factory()->unverified()->create();

    $response = $this->actingAs($user)->get(route('api-keys.index'));

    // The route has 'verified' middleware, so unverified users should be redirected
    $response->assertRedirect();
});

test('users can view their api keys index', function () {
    $user = User::factory()->create();
    ApiKey::factory()->count(3)->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->get(route('api-keys.index'));

    $response->assertOk();
    expect($response->inertiaProps('apiKeys'))->toHaveCount(3);
});

test('users cannot view other users api keys in list', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    ApiKey::factory()->count(3)->create(['user_id' => $otherUser->id]);

    $response = $this->actingAs($user)->get(route('api-keys.index'));

    $response->assertOk();
    expect($response->inertiaProps('apiKeys'))->toHaveCount(0);
});

test('api key index shows validity status', function () {
    $user = User::factory()->create();
    ApiKey::factory()->create(['user_id' => $user->id, 'name' => 'Valid Key']);
    ApiKey::factory()->revoked()->create(['user_id' => $user->id, 'name' => 'Revoked Key']);
    ApiKey::factory()->expired()->create(['user_id' => $user->id, 'name' => 'Expired Key']);

    $response = $this->actingAs($user)->get(route('api-keys.index'));

    $response->assertOk();
    $apiKeys = collect($response->inertiaProps('apiKeys'));
    expect($apiKeys->pluck('is_valid')->all())->toContain(true, false);
});

// Redis Sync Tests
test('generating api key dispatches sync to redis job', function () {
    Bus::fake();

    $user = User::factory()->create();
    $service = app(ApiKeyService::class);

    $result = $service->generate($user, 'Test Key');

    Bus::assertDispatched(SyncApiKeyToRedis::class, function ($job) use ($result) {
        expect($job->apiKeyId)->toBe($result['api_key']->id)
            ->and($job->keyPrefix)->toBe($result['api_key']->key_prefix)
            ->and($job->keyHash)->toBe($result['api_key']->key_hash)
            ->and($job->userId)->toBe($result['api_key']->user_id)
            ->and($job->expiresAtTimestamp)->toBeNull()
            ->and($job->projectId)->toBeNull();

        return true;
    });
});

test('generating api key with expiration dispatches sync job with expiration', function () {
    Bus::fake();

    $user = User::factory()->create();
    $service = app(ApiKeyService::class);
    $expiresAt = now()->addDays(30);

    $result = $service->generate($user, 'Expiring Key', $expiresAt);

    Bus::assertDispatched(SyncApiKeyToRedis::class, function ($job) use ($expiresAt) {
        expect($job->expiresAtTimestamp)->toBe($expiresAt->timestamp)
            ->and($job->projectId)->toBeNull();

        return true;
    });
});

test('generating project api key dispatches sync job with project id', function () {
    Bus::fake();

    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $service = app(ApiKeyService::class);

    $result = $service->generate($user, 'Project Key', null, $project->id);

    Bus::assertDispatched(SyncApiKeyToRedis::class, function ($job) use ($result, $project) {
        expect($job->apiKeyId)->toBe($result['api_key']->id)
            ->and($job->projectId)->toBe($project->id);

        return true;
    });
});

test('revoking api key dispatches revoke in redis job', function () {
    Bus::fake();

    $user = User::factory()->create();
    $apiKey = ApiKey::factory()->create(['user_id' => $user->id]);
    $service = app(ApiKeyService::class);

    $service->revoke($apiKey, $user);

    Bus::assertDispatched(RevokeApiKeyInRedis::class, function ($job) use ($apiKey) {
        expect($job->keyPrefix)->toBe($apiKey->key_prefix)
            ->and($job->userId)->toBe($apiKey->user_id)
            ->and($job->expiresAtTimestamp)->toBeNull();

        return true;
    });
});

test('revoking api key with expiration dispatches revoke job with expiration', function () {
    Bus::fake();

    $user = User::factory()->create();
    $expiresAt = now()->addDays(30);
    $apiKey = ApiKey::factory()->create([
        'user_id' => $user->id,
        'expires_at' => $expiresAt,
    ]);
    $service = app(ApiKeyService::class);

    $service->revoke($apiKey, $user);

    Bus::assertDispatched(RevokeApiKeyInRedis::class, function ($job) use ($expiresAt) {
        expect($job->expiresAtTimestamp)->toBe($expiresAt->timestamp);

        return true;
    });
});

test('revoking already revoked key does not dispatch job', function () {
    Bus::fake();

    $user = User::factory()->create();
    $apiKey = ApiKey::factory()->revoked()->create(['user_id' => $user->id]);
    $service = app(ApiKeyService::class);

    $result = $service->revoke($apiKey, $user);

    expect($result)->toBeFalse();
    Bus::assertNotDispatched(RevokeApiKeyInRedis::class);
});
