<?php

use App\Services\TurnstileService;
use Illuminate\Support\Str;

use function Pest\Laravel\postJson;

beforeEach(function () {
    // Set up Turnstile config for testing
    config()->set('services.turnstile.secret_key', 'test-secret-key');
    config()->set('services.turnstile.verify_url', 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
});

it('creates a sandbox queue with valid turnstile token', function () {
    // Mock the TurnstileService to return true for verification
    $mockService = $this->mock(TurnstileService::class);
    $mockService->shouldReceive('verify')
        ->once()
        ->with('valid-turnstile-token', \Mockery::any())
        ->andReturnTrue();

    $response = postJson(route('api.sandbox.queues.store'), [
        'turnstile_token' => 'valid-turnstile-token',
    ]);

    $response->assertCreated()
        ->assertJsonStructure([
            'queue_id',
            'queue_url',
        ]);

    // Verify the queue_id is a valid UUID
    $queueId = $response->json('queue_id');
    expect($queueId)->toBeString()
        ->and(Str::isUuid($queueId))->toBeTrue();

    // Verify the queue_url contains the queue_id
    $queueUrl = $response->json('queue_url');
    expect($queueUrl)->toContain($queueId);
});

it('returns 422 when turnstile verification fails', function () {
    // Mock the TurnstileService to return false for verification
    $mockService = $this->mock(TurnstileService::class);
    $mockService->shouldReceive('verify')
        ->once()
        ->with('invalid-turnstile-token', \Mockery::any())
        ->andReturnFalse();

    $response = postJson(route('api.sandbox.queues.store'), [
        'turnstile_token' => 'invalid-turnstile-token',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'message' => 'Turnstile verification failed.',
        ]);
});

it('requires a turnstile token', function () {
    $response = postJson(route('api.sandbox.queues.store'), []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['turnstile_token']);
});

it('validates turnstile token is a string', function () {
    $response = postJson(route('api.sandbox.queues.store'), [
        'turnstile_token' => ['not', 'a', 'string'],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['turnstile_token']);
});

it('applies rate limiting', function () {
    // Mock the TurnstileService to always succeed
    $mockService = $this->mock(TurnstileService::class);
    $mockService->shouldReceive('verify')->andReturnTrue();

    // Make 61 requests (the limit is 60 per minute)
    for ($i = 0; $i < 61; $i++) {
        $response = postJson(route('api.sandbox.queues.store'), [
            'turnstile_token' => 'test-token',
        ]);
    }

    // The last request should be rate limited
    $response->assertStatus(429);
});
