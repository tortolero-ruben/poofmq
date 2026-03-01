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

it('compiles the poofmq proto contract to a descriptor set', function () {
    $projectRoot = dirname(__DIR__, 2);
    $outputDirectory = $projectRoot.'/.tmp-proto-test';
    $descriptorFile = $outputDirectory.'/poofmq.pb';

    $dockerCheck = new Process(['docker', '--version']);
    $dockerCheck->run();

    if (! $dockerCheck->isSuccessful()) {
        $this->markTestSkipped('Docker is required to compile proto contracts in this test.');
    }

    if (! is_dir($outputDirectory)) {
        mkdir($outputDirectory, 0755, true);
    }

    $command = [
        'docker',
        'run',
        '--rm',
    ];

    if (function_exists('posix_getuid') && function_exists('posix_getgid')) {
        $command[] = '--user';
        $command[] = posix_getuid().':'.posix_getgid();
    }

    $command = array_merge($command, [
        '-v',
        $projectRoot.':/defs',
        'namely/protoc-all:1.51_2',
        '-d',
        'proto',
        '-l',
        'descriptor_set',
        '-o',
        '/defs/.tmp-proto-test',
        '--descr-filename',
        'poofmq.pb',
    ]);

    $compile = new Process($command);
    $compile->setTimeout(180);
    $compile->run();

    expect($compile->isSuccessful())
        ->toBeTrue($compile->getErrorOutput().$compile->getOutput());
    expect($descriptorFile)->toBeFile();

    if (is_file($descriptorFile)) {
        unlink($descriptorFile);
    }

    if (is_dir($outputDirectory)) {
        rmdir($outputDirectory);
    }
});
