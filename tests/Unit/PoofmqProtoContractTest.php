<?php

use Symfony\Component\Process\Process;

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
    ];

    $dockerCheck = new Process(['docker', '--version']);
    $dockerCheck->run();

    if (! $dockerCheck->isSuccessful()) {
        $this->markTestSkipped('Docker is required to generate proto artifacts in this test.');
    }

    $runGenerate = fn () => tap(new Process(['make', 'proto-generate'], $projectRoot), function (Process $process): void {
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

    $initialHashes = $collectHashes();

    $generateRun = $runGenerate();
    if (! $generateRun->isSuccessful()) {
        $output = $generateRun->getErrorOutput().$generateRun->getOutput();

        if (str_contains($output, 'resource_exhausted: too many requests')) {
            $this->markTestSkipped('Buf registry rate limited generation in CI/local verification.');
        }
    }

    expect($generateRun->isSuccessful())->toBeTrue($generateRun->getErrorOutput().$generateRun->getOutput());

    expect($collectHashes())->toEqual($initialHashes);

    foreach ($generatedFiles as $generatedFile) {
        expect(filesize($generatedFile))->toBeGreaterThan(0);
    }
});
