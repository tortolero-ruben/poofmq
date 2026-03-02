<?php

use App\Services\TurnstileService;
use Illuminate\Support\Facades\Http;

it('returns true when turnstile verification succeeds', function () {
    Http::fake([
        'challenges.cloudflare.com/*' => Http::response(['success' => true], 200),
    ]);

    $service = new TurnstileService(
        secretKey: 'test-secret-key',
        verifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
    );
    $result = $service->verify('valid-token');

    expect($result)->toBeTrue();

    Http::assertSent(function ($request) {
        return $request->url() === 'https://challenges.cloudflare.com/turnstile/v0/siteverify' &&
            $request['secret'] === 'test-secret-key' &&
            $request['response'] === 'valid-token';
    });
});

it('returns false when turnstile verification fails', function () {
    Http::fake([
        'challenges.cloudflare.com/*' => Http::response(['success' => false, 'error-codes' => ['invalid-input-response']], 200),
    ]);

    $service = new TurnstileService(
        secretKey: 'test-secret-key',
        verifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
    );
    $result = $service->verify('invalid-token');

    expect($result)->toBeFalse();
});

it('returns false when http request fails', function () {
    Http::fake([
        'challenges.cloudflare.com/*' => Http::response(null, 500),
    ]);

    $service = new TurnstileService(
        secretKey: 'test-secret-key',
        verifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
    );
    $result = $service->verify('any-token');

    expect($result)->toBeFalse();
});

it('includes client ip when provided', function () {
    Http::fake([
        'challenges.cloudflare.com/*' => Http::response(['success' => true], 200),
    ]);

    $service = new TurnstileService(
        secretKey: 'test-secret-key',
        verifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
    );
    $service->verify('valid-token', '192.168.1.1');

    Http::assertSent(function ($request) {
        return $request['remoteip'] === '192.168.1.1';
    });
});

it('can be created from config', function () {
    config()->set('services.turnstile.secret_key', 'config-secret-key');
    config()->set('services.turnstile.verify_url', 'https://config.verify.url');

    $service = TurnstileService::fromConfig();

    expect($service)->toBeInstanceOf(TurnstileService::class);
});
