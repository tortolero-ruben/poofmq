<?php

namespace App\Jobs;

use App\Models\RailwayBillingSnapshot;
use App\Services\RailwayBillingService;
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
        RailwayBillingService $railwayBillingService,
        RunwayCalculator $runwayCalculator
    ): void {
        try {
            $summary = $railwayBillingService->fetchSummary();
            $budgetCents = (int) config('poofmq_capacity.monthly_budget_cents', 500);
            $runwayMonths = $runwayCalculator->months(
                balanceCents: $summary['balance_cents'],
                targetMonthlyBudgetCents: $budgetCents
            );

            RailwayBillingSnapshot::query()->create([
                'balance_cents' => $summary['balance_cents'],
                'month_to_date_spend_cents' => $summary['month_to_date_spend_cents'],
                'runway_months' => $runwayMonths,
                'captured_at' => $summary['captured_at'],
                'raw_payload' => $summary['raw_payload'],
            ]);

            Log::info('Railway billing snapshot synced', [
                'balance_cents' => $summary['balance_cents'],
                'month_to_date_spend_cents' => $summary['month_to_date_spend_cents'],
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
