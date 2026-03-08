<?php

use App\Services\RailwayUsageService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    config()->set('services.railway.api_token', 'railway-test-token');
    config()->set('services.railway.workspace_id', 'ws_123');
    config()->set('services.railway.project_id', 'proj_123');
    config()->set('services.railway.graphql_endpoint', 'https://railway.example.test/graphql');
});

it('normalizes the railway graphql payload into snapshot attributes', function () {
    Http::fake([
        'https://railway.example.test/graphql' => Http::response([
            'data' => [
                'workspace' => [
                    'id' => 'ws_123',
                    'name' => 'Workspace',
                    'customer' => [
                        'currentUsage' => 7.25,
                        'creditBalance' => 5.0,
                        'appliedCredits' => 0.5,
                        'billingPeriod' => [
                            'start' => now()->startOfMonth()->toIso8601String(),
                            'end' => now()->endOfMonth()->toIso8601String(),
                        ],
                        'invoices' => [
                            [
                                'invoiceId' => 'inv_1',
                                'total' => 1200,
                                'amountPaid' => 1200,
                                'amountDue' => 0,
                                'periodStart' => now()->subMonth()->startOfMonth()->toDateString(),
                                'periodEnd' => now()->subMonth()->endOfMonth()->toDateString(),
                                'status' => 'paid',
                            ],
                        ],
                    ],
                ],
                'project' => [
                    'id' => 'proj_123',
                    'name' => 'PoofMQ',
                    'services' => [
                        'edges' => [
                            [
                                'node' => [
                                    'id' => 'svc_1',
                                    'name' => 'go-api',
                                ],
                            ],
                        ],
                    ],
                ],
                'projectUsage' => [
                    [
                        'measurement' => 'CPU_USAGE',
                        'value' => 12.5,
                        'tags' => [
                            'environmentId' => 'env_1',
                            'projectId' => 'proj_123',
                            'serviceId' => 'svc_1',
                        ],
                    ],
                ],
                'workspaceUsage' => [
                    [
                        'measurement' => 'CPU_USAGE',
                        'value' => 25.0,
                        'tags' => [
                            'environmentId' => null,
                            'projectId' => null,
                            'serviceId' => null,
                        ],
                    ],
                ],
                'projectEstimatedUsage' => [
                    [
                        'measurement' => 'CPU_USAGE',
                        'estimatedValue' => 36.5,
                        'projectId' => 'proj_123',
                    ],
                ],
                'workspaceEstimatedUsage' => [
                    [
                        'measurement' => 'CPU_USAGE',
                        'estimatedValue' => 73.0,
                        'projectId' => null,
                    ],
                ],
            ],
        ], 200),
    ]);

    $snapshot = app(RailwayUsageService::class)->fetchFundingSnapshot();

    expect($snapshot['workspace_current_spend_cents'])->toBe(725)
        ->and($snapshot['poofmq_attributed_current_spend_cents'])->toBeGreaterThanOrEqual(0)
        ->and($snapshot['credit_balance_cents'])->toBe(500)
        ->and($snapshot['applied_credits_cents'])->toBe(50)
        ->and($snapshot['latest_invoice_total_cents'])->toBe(1200)
        ->and($snapshot['workspace_estimated_spend_cents'])->toBeGreaterThan(0)
        ->and($snapshot['poofmq_attributed_estimated_spend_cents'])->toBeGreaterThanOrEqual(0)
        ->and(data_get($snapshot, 'raw_payload.current_usage.0.service_name'))->toBe('go-api');
});

it('fails when railway workspace and project ids are missing', function () {
    config()->set('services.railway.workspace_id', null);

    expect(fn () => app(RailwayUsageService::class)->fetchFundingSnapshot())
        ->toThrow(RuntimeException::class, 'Railway GraphQL workspace and project IDs are not configured.');
});
