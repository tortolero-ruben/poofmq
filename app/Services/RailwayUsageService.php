<?php

namespace App\Services;

use Carbon\CarbonImmutable;

class RailwayUsageService
{
    private const array MEASUREMENTS = [
        'CPU_USAGE',
        'MEMORY_USAGE_GB',
        'NETWORK_RX_GB',
        'NETWORK_TX_GB',
    ];

    public function __construct(
        public RailwayGraphqlClient $railwayGraphqlClient
    ) {}

    /**
     * Fetch the current Railway funding snapshot for the configured workspace and project.
     *
     * @return array{
     *     workspace_current_spend_cents: int,
     *     workspace_estimated_spend_cents: int,
     *     poofmq_attributed_current_spend_cents: int,
     *     poofmq_attributed_estimated_spend_cents: int,
     *     credit_balance_cents: int,
     *     applied_credits_cents: int,
     *     latest_invoice_total_cents: int|null,
     *     billing_period_starts_at: string,
     *     billing_period_ends_at: string,
     *     captured_at: string,
     *     raw_payload: array<string, mixed>
     * }
     */
    public function fetchFundingSnapshot(): array
    {
        $workspaceId = config('services.railway.workspace_id');
        $projectId = config('services.railway.project_id');

        if (! is_string($workspaceId) || $workspaceId === '' || ! is_string($projectId) || $projectId === '') {
            throw new \RuntimeException('Railway GraphQL workspace and project IDs are not configured.');
        }

        $data = $this->railwayGraphqlClient->query($this->fundingSnapshotQuery(), [
            'workspaceId' => $workspaceId,
            'projectId' => $projectId,
            'measurements' => self::MEASUREMENTS,
            'groupBy' => ['SERVICE_ID'],
        ]);

        /** @var array<string, mixed> $workspace */
        $workspace = data_get($data, 'workspace', []);
        /** @var array<string, mixed> $customer */
        $customer = data_get($workspace, 'customer', []);
        /** @var array<string, mixed> $billingPeriod */
        $billingPeriod = data_get($customer, 'billingPeriod', []);
        /** @var array<string, mixed> $project */
        $project = data_get($data, 'project', []);
        /** @var list<array<string, mixed>> $serviceEdges */
        $serviceEdges = data_get($project, 'services.edges', []);
        /** @var list<array<string, mixed>> $usage */
        $projectUsage = data_get($data, 'projectUsage', []);
        /** @var list<array<string, mixed>> $workspaceUsage */
        $workspaceUsage = data_get($data, 'workspaceUsage', []);
        /** @var list<array<string, mixed>> $estimatedUsage */
        $projectEstimatedUsage = data_get($data, 'projectEstimatedUsage', []);
        /** @var list<array<string, mixed>> $workspaceEstimatedUsage */
        $workspaceEstimatedUsage = data_get($data, 'workspaceEstimatedUsage', []);
        /** @var list<array<string, mixed>> $invoices */
        $invoices = data_get($customer, 'invoices', []);

        $capturedAt = now()->toIso8601String();
        $billingPeriodStartsAt = (string) ($billingPeriod['start'] ?? $capturedAt);
        $billingPeriodEndsAt = (string) ($billingPeriod['end'] ?? $capturedAt);
        $workspaceCurrentSpendCents = $this->normalizeDollarAmountToCents($customer['currentUsage'] ?? 0);
        $workspaceEstimatedSpendCents = $this->estimateSpendCents(
            currentSpendCents: $workspaceCurrentSpendCents,
            billingPeriodStartsAt: $billingPeriodStartsAt,
            billingPeriodEndsAt: $billingPeriodEndsAt,
        );
        $attributionRatio = $this->attributionRatio($projectUsage, $workspaceUsage);
        $poofmqAttributedCurrentSpendCents = (int) round($workspaceCurrentSpendCents * $attributionRatio);
        $poofmqAttributedEstimatedSpendCents = (int) round($workspaceEstimatedSpendCents * $this->attributionRatio(
            $projectEstimatedUsage,
            $workspaceEstimatedUsage
        ));

        return [
            'workspace_current_spend_cents' => $workspaceCurrentSpendCents,
            'workspace_estimated_spend_cents' => $workspaceEstimatedSpendCents,
            'poofmq_attributed_current_spend_cents' => $poofmqAttributedCurrentSpendCents,
            'poofmq_attributed_estimated_spend_cents' => $poofmqAttributedEstimatedSpendCents,
            'credit_balance_cents' => $this->normalizeDollarAmountToCents($customer['creditBalance'] ?? 0),
            'applied_credits_cents' => $this->normalizeDollarAmountToCents($customer['appliedCredits'] ?? 0),
            'latest_invoice_total_cents' => $this->latestInvoiceTotalCents($invoices),
            'billing_period_starts_at' => $billingPeriodStartsAt,
            'billing_period_ends_at' => $billingPeriodEndsAt,
            'captured_at' => $capturedAt,
            'raw_payload' => [
                'workspace' => [
                    'id' => $workspace['id'] ?? null,
                    'name' => $workspace['name'] ?? null,
                ],
                'customer' => [
                    'current_usage' => $customer['currentUsage'] ?? 0,
                    'credit_balance' => $customer['creditBalance'] ?? 0,
                    'applied_credits' => $customer['appliedCredits'] ?? 0,
                    'billing_period' => [
                        'start' => $billingPeriodStartsAt,
                        'end' => $billingPeriodEndsAt,
                    ],
                    'invoices' => $invoices,
                ],
                'project' => [
                    'id' => $project['id'] ?? null,
                    'name' => $project['name'] ?? null,
                ],
                'attribution_ratio' => round($attributionRatio, 4),
                'service_directory' => $this->serviceDirectory($serviceEdges),
                'current_usage' => $this->normalizeUsageEntries($projectUsage, $serviceEdges),
                'workspace_usage' => $this->normalizeUsageEntries($workspaceUsage, $serviceEdges),
                'estimated_usage' => $this->normalizeEstimatedUsageEntries($projectEstimatedUsage),
                'workspace_estimated_usage' => $this->normalizeEstimatedUsageEntries($workspaceEstimatedUsage),
            ],
        ];
    }

    protected function fundingSnapshotQuery(): string
    {
        return <<<'GRAPHQL'
query FundingSnapshot(
  $workspaceId: String!
  $projectId: String!
  $measurements: [MetricMeasurement!]!
  $groupBy: [MetricTag!]
) {
  workspace(workspaceId: $workspaceId) {
    id
    name
    customer {
      appliedCredits
      creditBalance
      currentUsage
      billingPeriod {
        start
        end
      }
      invoices {
        invoiceId
        total
        amountPaid
        amountDue
        periodStart
        periodEnd
        status
      }
    }
  }
  project(id: $projectId) {
    id
    name
    services {
      edges {
        node {
          id
          name
        }
      }
    }
  }
  projectUsage: usage(
    workspaceId: $workspaceId
    projectId: $projectId
    measurements: $measurements
    groupBy: $groupBy
  ) {
    measurement
    value
    tags {
      environmentId
      projectId
      serviceId
    }
  }
  workspaceUsage: usage(
    workspaceId: $workspaceId
    measurements: $measurements
  ) {
    measurement
    value
    tags {
      environmentId
      projectId
      serviceId
    }
  }
  projectEstimatedUsage: estimatedUsage(
    workspaceId: $workspaceId
    projectId: $projectId
    measurements: $measurements
  ) {
    measurement
    estimatedValue
    projectId
  }
  workspaceEstimatedUsage: estimatedUsage(
    workspaceId: $workspaceId
    measurements: $measurements
  ) {
    measurement
    estimatedValue
    projectId
  }
}
GRAPHQL;
    }

    /**
     * @param  list<array<string, mixed>>  $serviceEdges
     * @return array<string, string>
     */
    protected function serviceDirectory(array $serviceEdges): array
    {
        $directory = [];

        foreach ($serviceEdges as $serviceEdge) {
            $serviceId = data_get($serviceEdge, 'node.id');
            $serviceName = data_get($serviceEdge, 'node.name');

            if (is_string($serviceId) && $serviceId !== '' && is_string($serviceName) && $serviceName !== '') {
                $directory[$serviceId] = $serviceName;
            }
        }

        return $directory;
    }

    /**
     * @param  list<array<string, mixed>>  $usageEntries
     * @param  list<array<string, mixed>>  $serviceEdges
     * @return list<array{measurement: string, label: string, value: float, service_id: string|null, service_name: string|null}>
     */
    protected function normalizeUsageEntries(array $usageEntries, array $serviceEdges): array
    {
        $serviceDirectory = $this->serviceDirectory($serviceEdges);

        return collect($usageEntries)
            ->map(function (array $usageEntry) use ($serviceDirectory): array {
                $serviceId = data_get($usageEntry, 'tags.serviceId');

                return [
                    'measurement' => (string) ($usageEntry['measurement'] ?? 'MEASUREMENT_UNSPECIFIED'),
                    'label' => $this->measurementLabel((string) ($usageEntry['measurement'] ?? 'MEASUREMENT_UNSPECIFIED')),
                    'value' => round((float) ($usageEntry['value'] ?? 0), 4),
                    'service_id' => is_string($serviceId) ? $serviceId : null,
                    'service_name' => is_string($serviceId) ? ($serviceDirectory[$serviceId] ?? null) : null,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  list<array<string, mixed>>  $estimatedUsageEntries
     * @return list<array{measurement: string, label: string, estimated_value: float}>
     */
    protected function normalizeEstimatedUsageEntries(array $estimatedUsageEntries): array
    {
        return collect($estimatedUsageEntries)
            ->map(fn (array $usageEntry): array => [
                'measurement' => (string) ($usageEntry['measurement'] ?? 'MEASUREMENT_UNSPECIFIED'),
                'label' => $this->measurementLabel((string) ($usageEntry['measurement'] ?? 'MEASUREMENT_UNSPECIFIED')),
                'estimated_value' => round((float) ($usageEntry['estimatedValue'] ?? 0), 4),
            ])
            ->values()
            ->all();
    }

    protected function estimateSpendCents(
        int $currentSpendCents,
        string $billingPeriodStartsAt,
        string $billingPeriodEndsAt
    ): int {
        $start = CarbonImmutable::parse($billingPeriodStartsAt);
        $end = CarbonImmutable::parse($billingPeriodEndsAt);
        $now = CarbonImmutable::now();
        $totalSeconds = max(1, $end->diffInSeconds($start));
        $elapsedSeconds = max(1, min($totalSeconds, $now->diffInSeconds($start)));

        return (int) round($currentSpendCents / ($elapsedSeconds / $totalSeconds));
    }

    /**
     * @param  list<array<string, mixed>>  $projectEntries
     * @param  list<array<string, mixed>>  $workspaceEntries
     */
    protected function attributionRatio(array $projectEntries, array $workspaceEntries): float
    {
        $workspaceTotals = $this->measurementTotals($workspaceEntries, 'value');
        $projectTotals = $this->measurementTotals($projectEntries, 'value');
        $ratios = [];

        foreach ($workspaceTotals as $measurement => $workspaceTotal) {
            if ($workspaceTotal <= 0) {
                continue;
            }

            $projectTotal = $projectTotals[$measurement] ?? 0.0;
            $ratios[] = min(1.0, max(0.0, $projectTotal / $workspaceTotal));
        }

        if ($ratios === []) {
            return 1.0;
        }

        return array_sum($ratios) / count($ratios);
    }

    /**
     * @param  list<array<string, mixed>>  $entries
     * @return array<string, float>
     */
    protected function measurementTotals(array $entries, string $valueKey): array
    {
        $totals = [];

        foreach ($entries as $entry) {
            $measurement = (string) ($entry['measurement'] ?? 'MEASUREMENT_UNSPECIFIED');
            $totals[$measurement] = ($totals[$measurement] ?? 0.0) + (float) ($entry[$valueKey] ?? 0);
        }

        return $totals;
    }

    /**
     * @param  list<array<string, mixed>>  $invoices
     */
    protected function latestInvoiceTotalCents(array $invoices): ?int
    {
        $latestInvoice = collect($invoices)->first();

        if (! is_array($latestInvoice)) {
            return null;
        }

        return $this->normalizeInvoiceCents($latestInvoice['total'] ?? null);
    }

    protected function measurementLabel(string $measurement): string
    {
        return match ($measurement) {
            'CPU_USAGE' => 'CPU hours',
            'MEMORY_USAGE_GB' => 'Memory GB-hours',
            'NETWORK_RX_GB' => 'Ingress GB',
            'NETWORK_TX_GB' => 'Egress GB',
            default => str_replace('_', ' ', strtolower($measurement)),
        };
    }

    protected function normalizeDollarAmountToCents(mixed $value): int
    {
        if (is_numeric($value)) {
            return (int) round(((float) $value) * 100);
        }

        return 0;
    }

    protected function normalizeInvoiceCents(mixed $value): int
    {
        if (is_int($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (int) round((float) $value);
        }

        return 0;
    }
}
