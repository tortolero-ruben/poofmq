<?php

namespace App\Services;

use App\Models\RailwayBillingSnapshot;

class FundingStatusService
{
    public function __construct(
        public DonationLedgerService $donationLedgerService
    ) {}

    /**
     * @return array{
     *     funding: array{
     *         summary: array{
     *             gross_donations_cents: int,
     *             refunds_cents: int,
     *             net_funding_cents: int,
     *             event_count: int
     *         },
     *         history: list<array{
     *             id: string,
     *             provider: string,
     *             provider_event_id: string,
     *             event_type: string,
     *             amount_cents: int,
     *             currency: string,
     *             donor_name: string|null,
     *             happened_at: string
     *         }>
     *     },
     *     billing: array{
     *         latest: array{
     *             workspace_current_spend_cents: int,
     *             workspace_estimated_spend_cents: int,
     *             poofmq_attributed_current_spend_cents: int,
     *             poofmq_attributed_estimated_spend_cents: int,
     *             funding_gap_cents: int,
     *             runway_months: float,
     *             latest_invoice_total_cents: int|null,
     *             credit_balance_cents: int,
     *             applied_credits_cents: int,
     *             coverage_percent: float,
     *             captured_at: string,
     *             billing_period_starts_at: string|null,
     *             billing_period_ends_at: string|null,
     *             breakdown: array{
     *                 current_usage: list<array{measurement: string, label: string, value: float, service_id: string|null, service_name: string|null}>,
     *                 estimated_usage: list<array{measurement: string, label: string, estimated_value: float}>
     *             }
     *         }|null,
     *         trend: array{
     *             workspace_current_spend_delta_cents: int,
     *             poofmq_attributed_estimated_spend_delta_cents: int,
     *             funding_gap_delta_cents: int
     *         },
     *         snapshots: list<array{
     *             id: string,
     *             workspace_current_spend_cents: int,
     *             poofmq_attributed_estimated_spend_cents: int,
     *             funding_gap_cents: int,
     *             captured_at: string
     *         }>,
     *         is_stale: bool,
     *         snapshot_age_minutes: int|null
     *     }
     * }
     */
    public function buildPublic(): array
    {
        $fundingSummary = $this->donationLedgerService->summary();
        $snapshots = RailwayBillingSnapshot::query()
            ->orderByDesc('captured_at')
            ->limit(12)
            ->get();

        /** @var RailwayBillingSnapshot|null $latest */
        $latest = $snapshots->first();
        /** @var RailwayBillingSnapshot|null $previous */
        $previous = $snapshots->skip(1)->first();
        $snapshotAgeMinutes = $latest?->captured_at?->diffInMinutes(now());
        $staleThresholdMinutes = (int) config('observability.thresholds.railway_snapshot_max_age_minutes', 120);

        return [
            'funding' => [
                'summary' => $fundingSummary,
            ],
            'billing' => [
                'latest' => $latest === null ? null : $this->publicLatestPayload($latest, $fundingSummary['net_funding_cents']),
                'trend' => [
                    'workspace_current_spend_delta_cents' => (int) ($latest?->current_spend_cents ?? 0) - (int) ($previous?->current_spend_cents ?? 0),
                    'poofmq_attributed_estimated_spend_delta_cents' => (int) ($latest?->poofmq_attributed_estimated_spend_cents ?? 0) - (int) ($previous?->poofmq_attributed_estimated_spend_cents ?? 0),
                    'funding_gap_delta_cents' => (int) ($latest?->funding_gap_cents ?? 0) - (int) ($previous?->funding_gap_cents ?? 0),
                ],
                'snapshots' => $snapshots
                    ->reverse()
                    ->map(fn (RailwayBillingSnapshot $snapshot) => [
                        'id' => $snapshot->id,
                        'workspace_current_spend_cents' => (int) $snapshot->current_spend_cents,
                        'poofmq_attributed_estimated_spend_cents' => (int) $snapshot->poofmq_attributed_estimated_spend_cents,
                        'funding_gap_cents' => (int) $snapshot->funding_gap_cents,
                        'captured_at' => $snapshot->captured_at->toIso8601String(),
                    ])
                    ->values()
                    ->all(),
                'is_stale' => $snapshotAgeMinutes !== null && $snapshotAgeMinutes > $staleThresholdMinutes,
                'snapshot_age_minutes' => $snapshotAgeMinutes,
            ],
        ];
    }

    /**
     * @return array{
     *     funding: array{
     *         summary: array{
     *             gross_donations_cents: int,
     *             refunds_cents: int,
     *             net_funding_cents: int,
     *             event_count: int
     *         },
     *         history: list<array{
     *             id: string,
     *             provider: string,
     *             provider_event_id: string,
     *             event_type: string,
     *             amount_cents: int,
     *             currency: string,
     *             donor_name: string|null,
     *             happened_at: string
     *         }>
     *     },
     *     billing: array{
     *         latest: array{
     *             workspace_current_spend_cents: int,
     *             workspace_estimated_spend_cents: int,
     *             poofmq_attributed_current_spend_cents: int,
     *             poofmq_attributed_estimated_spend_cents: int,
     *             funding_gap_cents: int,
     *             runway_months: float,
     *             coverage_percent: float,
     *             captured_at: string,
     *             latest_invoice_total_cents: int|null,
     *             credit_balance_cents: int,
     *             applied_credits_cents: int,
     *             billing_period_starts_at: string|null,
     *             billing_period_ends_at: string|null,
     *             breakdown: array{
     *                 current_usage: list<array{measurement: string, label: string, value: float, service_id: string|null, service_name: string|null}>,
     *                 estimated_usage: list<array{measurement: string, label: string, estimated_value: float}>
     *             }
     *         }|null,
     *         trend: array{
     *             workspace_current_spend_delta_cents: int,
     *             poofmq_attributed_estimated_spend_delta_cents: int,
     *             funding_gap_delta_cents: int
     *         },
     *         snapshots: list<array{
     *             id: string,
     *             workspace_current_spend_cents: int,
     *             poofmq_attributed_estimated_spend_cents: int,
     *             funding_gap_cents: int,
     *             captured_at: string
     *         }>,
     *         is_stale: bool,
     *         snapshot_age_minutes: int|null
     *     }
     * }
     */
    public function buildAdmin(): array
    {
        $payload = $this->buildPublic();
        $payload['funding']['history'] = $this->donationLedgerService->recentEntries();
        $latestSnapshot = RailwayBillingSnapshot::query()->orderByDesc('captured_at')->first();

        if ($latestSnapshot !== null) {
            $payload['billing']['latest'] = $this->adminLatestPayload(
                $latestSnapshot,
                $payload['funding']['summary']['net_funding_cents']
            );
        }

        return $payload;
    }

    /**
     * @return array{
     *     workspace_current_spend_cents: int,
     *     workspace_estimated_spend_cents: int,
     *     poofmq_attributed_current_spend_cents: int,
     *     poofmq_attributed_estimated_spend_cents: int,
     *     funding_gap_cents: int,
     *     runway_months: float,
     *     coverage_percent: float,
     *     captured_at: string
     * }
     */
    protected function publicLatestPayload(RailwayBillingSnapshot $snapshot, int $netFundingCents): array
    {
        $attributedEstimatedSpendCents = (int) $snapshot->poofmq_attributed_estimated_spend_cents;
        $coveragePercent = $attributedEstimatedSpendCents > 0
            ? round(min(100, ($netFundingCents / $attributedEstimatedSpendCents) * 100), 2)
            : 0.0;

        return [
            'workspace_current_spend_cents' => (int) $snapshot->current_spend_cents,
            'workspace_estimated_spend_cents' => (int) $snapshot->estimated_spend_cents,
            'poofmq_attributed_current_spend_cents' => (int) $snapshot->poofmq_attributed_current_spend_cents,
            'poofmq_attributed_estimated_spend_cents' => $attributedEstimatedSpendCents,
            'funding_gap_cents' => (int) $snapshot->funding_gap_cents,
            'runway_months' => (float) $snapshot->runway_months,
            'coverage_percent' => $coveragePercent,
            'captured_at' => $snapshot->captured_at->toIso8601String(),
        ];
    }

    /**
     * @return array{
     *     workspace_current_spend_cents: int,
     *     workspace_estimated_spend_cents: int,
     *     poofmq_attributed_current_spend_cents: int,
     *     poofmq_attributed_estimated_spend_cents: int,
     *     funding_gap_cents: int,
     *     runway_months: float,
     *     latest_invoice_total_cents: int|null,
     *     credit_balance_cents: int,
     *     applied_credits_cents: int,
     *     coverage_percent: float,
     *     captured_at: string,
     *     billing_period_starts_at: string|null,
     *     billing_period_ends_at: string|null,
     *     breakdown: array{
     *         current_usage: list<array{measurement: string, label: string, value: float, service_id: string|null, service_name: string|null}>,
     *         estimated_usage: list<array{measurement: string, label: string, estimated_value: float}>
     *     }
     * }
     */
    protected function adminLatestPayload(RailwayBillingSnapshot $snapshot, int $netFundingCents): array
    {
        /** @var array<string, mixed> $rawPayload */
        $rawPayload = $snapshot->raw_payload ?? [];
        $payload = $this->publicLatestPayload($snapshot, $netFundingCents);

        return [
            ...$payload,
            'latest_invoice_total_cents' => $snapshot->latest_invoice_total_cents === null ? null : (int) $snapshot->latest_invoice_total_cents,
            'credit_balance_cents' => (int) $snapshot->credit_balance_cents,
            'applied_credits_cents' => (int) $snapshot->applied_credits_cents,
            'billing_period_starts_at' => $snapshot->billing_period_starts_at?->toIso8601String(),
            'billing_period_ends_at' => $snapshot->billing_period_ends_at?->toIso8601String(),
            'breakdown' => [
                'current_usage' => is_array($rawPayload['current_usage'] ?? null) ? $rawPayload['current_usage'] : [],
                'workspace_usage' => is_array($rawPayload['workspace_usage'] ?? null) ? $rawPayload['workspace_usage'] : [],
                'estimated_usage' => is_array($rawPayload['estimated_usage'] ?? null) ? $rawPayload['estimated_usage'] : [],
                'workspace_estimated_usage' => is_array($rawPayload['workspace_estimated_usage'] ?? null) ? $rawPayload['workspace_estimated_usage'] : [],
            ],
        ];
    }
}
