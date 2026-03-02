<?php

use Symfony\Component\Process\Process;

it('has openapi artifact version aligned with config openapi-version', function () {
    $projectRoot = dirname(__DIR__, 2);
    $versionFile = $projectRoot.'/config/openapi-version.txt';
    $openapiPath = $projectRoot.'/gen/openapi/poofmq.swagger.json';

    expect($versionFile)->toBeFile()
        ->and($openapiPath)->toBeFile();

    $expectedVersion = trim((string) file_get_contents($versionFile));
    expect($expectedVersion)->not->toBe('');

    $openapi = json_decode((string) file_get_contents($openapiPath), true);
    expect($openapi)->toBeArray()
        ->and($openapi['info'] ?? null)->toBeArray()
        ->and($openapi['info']['version'] ?? null)->toBe($expectedVersion)
        ->and($openapi['info']['title'] ?? null)->toBe('poofMQ API');
});

it('defines the canonical poofmq proto contract for mvp queue operations', function () {
    $contractPath = dirname(__DIR__, 2).'/proto/poofmq/v1/poofmq.proto';

    expect($contractPath)->toBeFile();

    $contract = file_get_contents($contractPath);

    expect($contract)->not->toBeFalse()
        ->and($contract)->toContain('syntax = "proto3";')
        ->and($contract)->toContain('package poofmq.v1;')
        ->and($contract)->toContain('service QueueService')
        ->and($contract)->toContain('rpc Push(PushMessageRequest) returns (PushMessageResponse)')
        ->and($contract)->toContain('rpc Pop(PopMessageRequest) returns (PopMessageResponse)')
        ->and($contract)->toContain('google.protobuf.Struct payload = 2;')
        ->and($contract)->toContain('string event_type = 1;')
        ->and($contract)->toContain('map<string, string> metadata = 3;')
        ->and($contract)->toContain('optional int32 ttl_seconds = 3;')
        ->and($contract)->toContain('optional int32 visibility_timeout_seconds = 2;')
        ->and($contract)->toContain('optional int32 wait_timeout_seconds = 3;')
        ->and($contract)->toContain('ENCRYPTION_MODE_EDGE_ENCRYPTED')
        ->and($contract)->toContain('ENCRYPTION_MODE_CLIENT_ENCRYPTED')
        ->and($contract)->toContain('MVP encryption field matrix')
        ->and($contract)->toContain('post: "/v1/queues/{queue_id}/messages"')
        ->and($contract)->toContain('post: "/v1/queues/{queue_id}/messages:pop"');
});

it('generates gRPC, gateway, and openapi artifacts deterministically', function () {
    $projectRoot = dirname(__DIR__, 2);
    $generatedFiles = [
        $projectRoot.'/gen/go/poofmq/v1/poofmq.pb.go',
        $projectRoot.'/gen/go/poofmq/v1/poofmq_grpc.pb.go',
        $projectRoot.'/gen/go/poofmq/v1/poofmq.pb.gw.go',
        $projectRoot.'/gen/openapi/poofmq.swagger.json',
        $projectRoot.'/dist/openapi/v1/poofmq.json',
    ];

    $dockerCheck = new Process(['docker', 'info']);
    $dockerCheck->run();

    if (! $dockerCheck->isSuccessful()) {
        $this->markTestSkipped('Docker daemon is required to generate proto artifacts in this test.');
    }

    $runGenerate = fn () => tap(new Process(['make', 'generate-artifacts'], $projectRoot), function (Process $process): void {
        $process->setTimeout(180);
        $process->run();
    });

    $collectHashes = function () use ($generatedFiles): array {
        $hashes = [];

        foreach ($generatedFiles as $generatedFile) {
            expect($generatedFile)->toBeFile();
            $hashes[$generatedFile] = hash_file('sha256', $generatedFile);
        }

        return $hashes;
    };

    $firstRun = $runGenerate();
    if (! $firstRun->isSuccessful()) {
        $output = $firstRun->getErrorOutput().$firstRun->getOutput();

        if (str_contains($output, 'resource_exhausted: too many requests')) {
            $this->markTestSkipped('Buf registry rate limited generation in CI/local verification.');
        }
    }

    expect($firstRun->isSuccessful())->toBeTrue($firstRun->getErrorOutput().$firstRun->getOutput());

    $hashesAfterFirst = $collectHashes();

    $secondRun = $runGenerate();
    expect($secondRun->isSuccessful())->toBeTrue($secondRun->getErrorOutput().$secondRun->getOutput());

    expect($collectHashes())->toEqual($hashesAfterFirst);

    foreach ($generatedFiles as $generatedFile) {
        expect(filesize($generatedFile))->toBeGreaterThan(0);
    }
});
