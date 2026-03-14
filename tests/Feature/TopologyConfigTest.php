<?php

it('declares env ownership using known services', function () {
    $topology = config('topology');

    expect($topology)
        ->toBeArray()
        ->toHaveKeys(['services', 'env_ownership', 'deployment_targets']);

    $services = array_keys($topology['services']);

    foreach ($topology['env_ownership'] as $key => $metadata) {
        expect($key)->toBeString();
        expect($metadata)->toHaveKeys(['owner', 'consumers']);
        expect($metadata['owner'])->toBeIn($services);
        expect($metadata['consumers'])->toBeArray()->not->toBeEmpty();

        foreach ($metadata['consumers'] as $consumer) {
            expect($consumer)->toBeIn($services);
        }
    }
});

it('keeps deployment target mappings inside the service boundary list', function () {
    $topology = config('topology');
    $services = array_keys($topology['services']);

    foreach ($topology['deployment_targets'] as $provider => $mapping) {
        expect($provider)->toBeString();
        expect($mapping)->toBeArray()->not->toBeEmpty();

        foreach ($mapping as $service => $notes) {
            expect($service)->toBeIn($services);
            expect($notes)->toBeString()->not->toBeEmpty();
        }
    }
});

it('tracks critical infrastructure env keys from .env.example in the ownership map', function () {
    $topologyEnvKeys = array_keys(config('topology.env_ownership'));
    $envExamplePath = base_path('.env.example');
    $envContents = file_get_contents($envExamplePath);

    expect($envContents)->not->toBeFalse();

    preg_match_all('/^([A-Z0-9_]+)=/m', (string) $envContents, $matches);
    $envKeys = collect($matches[1])->values();

    $criticalKeys = [
        'PORTAL_HTTP_PORT',
        'DB_CONNECTION',
        'DB_HOST',
        'DB_PORT',
        'DB_DATABASE',
        'DB_USERNAME',
        'DB_PASSWORD',
        'POSTGRES_HOST_PORT',
        'REDIS_HOST',
        'REDIS_PORT',
        'REDIS_HOST_PORT',
        'REDIS_PASSWORD',
        'REDIS_QUEUE',
        'GO_API_BASE_URL',
        'GO_API_TIMEOUT_SECONDS',
        'GO_API_HTTP_PORT',
        'GO_API_HOST_PORT',
        'GO_API_LOG_LEVEL',
        'GO_API_ALLOW_ORIGIN',
        'CLOUDFLARE_ACCOUNT_ID',
        'CLOUDFLARE_API_TOKEN',
    ];

    foreach ($criticalKeys as $key) {
        expect($envKeys->contains($key))->toBeTrue();
        expect($topologyEnvKeys)->toContain($key);
    }
});
