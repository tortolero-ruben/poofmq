<?php

test('quickstart documentation includes shared sdk structure and queue operations', function () {
    $contents = file_get_contents(base_path('docs/quickstart.md'));

    expect($contents)
        ->toContain('START INSTANTLY')
        ->toContain('GET FREE DEV KEY')
        ->toContain('## Shared SDK Guide')
        ->toContain('### Node SDK Quickstart')
        ->toContain('### Python SDK Quickstart')
        ->toContain('npm install @poofmq/node')
        ->toContain('pip install poofmq')
        ->toContain('### Client-side Encryption')
        ->toContain('### API Reference')
        ->toContain('/v1/queues/{queue_id}/messages')
        ->toContain('/v1/queues/{queue_id}/messages:pop')
        ->toContain('`POOFMQ_BASE_URL` should point to the API origin')
        ->toContain('## Next steps');
});

test('sdk docs and developer key snippet reference the published node package and API base URL env var', function () {
    $nodeReadme = file_get_contents(base_path('sdks/node/README.md'));
    $pythonReadme = file_get_contents(base_path('sdks/python/README.md'));
    $developerKeyDialog = file_get_contents(base_path('resources/js/components/developer-key-dialog.tsx'));

    expect($nodeReadme)
        ->toContain('npm install @poofmq/node')
        ->toContain('process.env.POOFMQ_BASE_URL')
        ->not->toContain('https://go-api-production-ac36.up.railway.app');

    expect($pythonReadme)
        ->toContain('pip install poofmq')
        ->toContain('POOFMQ_BASE_URL')
        ->not->toContain('https://go-api-production-ac36.up.railway.app');

    expect($developerKeyDialog)
        ->toContain('npm install @poofmq/node')
        ->toContain('import { PoofmqClient } from "@poofmq/node";')
        ->toContain('baseUrl: process.env.POOFMQ_BASE_URL!');
});
