<?php

namespace App\Jobs;

use App\Models\RailwayBillingSnapshot;
use App\Services\DonationLedgerService;
use App\Services\RailwayUsageService;
use App\Services\RunwayCalculator;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SyncRailwayBillingSnapshot implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public array $backoff = [60, 300, 900];

    /**
     * Execute the job.
     */
    public function handle(
        RailwayUsageService $railwayUsageService,
        DonationLedgerService $donationLedgerService,
        RunwayCalculator $runwayCalculator
    ): void {
        try {
            $summary = $railwayUsageService->fetchFundingSnapshot();
            $funding = $donationLedgerService->summary();
            $budgetCents = (int) config('poofmq_capacity.monthly_budget_cents', 500);
            $fundingGapCents = max(0, $summary['poofmq_attributed_estimated_spend_cents'] - $funding['net_funding_cents']);
            $runwayMonths = $runwayCalculator->months(
                balanceCents: max(0, $funding['net_funding_cents'] - $summary['poofmq_attributed_current_spend_cents']),
                targetMonthlyBudgetCents: $budgetCents
            );

            RailwayBillingSnapshot::query()->create([
                'balance_cents' => $summary['credit_balance_cents'],
                'month_to_date_spend_cents' => $summary['workspace_current_spend_cents'],
                'current_spend_cents' => $summary['workspace_current_spend_cents'],
                'estimated_spend_cents' => $summary['workspace_estimated_spend_cents'],
                'poofmq_attributed_current_spend_cents' => $summary['poofmq_attributed_current_spend_cents'],
                'poofmq_attributed_estimated_spend_cents' => $summary['poofmq_attributed_estimated_spend_cents'],
                'credit_balance_cents' => $summary['credit_balance_cents'],
                'applied_credits_cents' => $summary['applied_credits_cents'],
                'latest_invoice_total_cents' => $summary['latest_invoice_total_cents'],
                'funding_gap_cents' => $fundingGapCents,
                'runway_months' => $runwayMonths,
                'snapshot_source' => 'railway_graphql',
                'captured_at' => $summary['captured_at'],
                'billing_period_starts_at' => $summary['billing_period_starts_at'],
                'billing_period_ends_at' => $summary['billing_period_ends_at'],
                'raw_payload' => $summary['raw_payload'],
            ]);

            Log::info('Railway billing snapshot synced', [
                'workspace_current_spend_cents' => $summary['workspace_current_spend_cents'],
                'poofmq_attributed_estimated_spend_cents' => $summary['poofmq_attributed_estimated_spend_cents'],
                'funding_gap_cents' => $fundingGapCents,
                'runway_months' => $runwayMonths,
            ]);
        } catch (\Throwable $exception) {
            Log::error('Railway billing snapshot sync failed', [
                'error' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }

    /**
     * Get the tags that should be assigned to the job.
     *
     * @return array<int, string>
     */
    public function tags(): array
    {
        return [
            'billing',
            'railway',
        ];
    }
}
