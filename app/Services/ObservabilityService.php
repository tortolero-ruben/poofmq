<?php

namespace App\Services;

use App\Models\RailwayBillingSnapshot;
use Illuminate\Support\Facades\Http;

class ObservabilityService
{
    /**
     * Create a new class instance.
     */
    public function __construct(
        public ObservabilityAlertService $observabilityAlertService
    ) {}

    /**
     * Collect dashboard-ready observability metrics and alerts.
     *
     * @return array{
     *     metrics: array{
     *         throughput_total: int,
     *         error_rate_percent: float,
     *         avg_push_latency_ms: float,
     *         avg_pop_latency_ms: float,
     *         redis_memory_bytes: int,
     *         burn_rate_cents_per_day: float,
     *         railway_snapshot_age_minutes: int
     *     },
     *     alerts: list<array{key: string, severity: string, message: string, runbook: string}>
     * }
     */
    public function collect(): array
    {
        $goMetrics = $this->fetchGoMetrics();

        $pushTotal = (int) ($goMetrics['push_total'] ?? 0);
        $pushErrors = (int) ($goMetrics['push_errors_total'] ?? 0);
        $popTotal = (int) ($goMetrics['pop_total'] ?? 0);
        $popErrors = (int) ($goMetrics['pop_errors_total'] ?? 0);

        $throughputTotal = $pushTotal + $popTotal;
        $totalErrors = $pushErrors + $popErrors;
        $errorRatePercent = $throughputTotal > 0 ? round(($totalErrors / $throughputTotal) * 100, 2) : 0.0;

        $metrics = [
            'throughput_total' => $throughputTotal,
            'error_rate_percent' => $errorRatePercent,
            'avg_push_latency_ms' => round((float) ($goMetrics['avg_push_latency_ms'] ?? 0.0), 2),
            'avg_pop_latency_ms' => round((float) ($goMetrics['avg_pop_latency_ms'] ?? 0.0), 2),
            'redis_memory_bytes' => (int) ($goMetrics['redis_memory_bytes'] ?? 0),
            'burn_rate_cents_per_day' => $this->calculateBurnRate(),
            'railway_snapshot_age_minutes' => $this->calculateSnapshotAgeMinutes(),
        ];

        return [
            'metrics' => $metrics,
            'alerts' => $this->observabilityAlertService->evaluate($metrics),
        ];
    }

    /**
     * Fetch metrics from the Go API observability endpoint.
     *
     * @return array<string, mixed>
     */
    protected function fetchGoMetrics(): array
    {
        $baseUrl = (string) config('services.go_api.base_url', '');

        if ($baseUrl === '') {
            return [];
        }

        try {
            $response = Http::timeout((int) config('services.go_api.timeout_seconds', 5))
                ->acceptJson()
                ->get(rtrim($baseUrl, '/').'/metrics');
        } catch (\Throwable) {
            return [];
        }

        if (! $response->successful()) {
            return [];
        }

        /** @var array<string, mixed> $payload */
        $payload = $response->json();

        return $payload;
    }

    /**
     * Calculate spend burn rate in cents per day from latest billing snapshot.
     */
    protected function calculateBurnRate(): float
    {
        $latestSnapshot = RailwayBillingSnapshot::query()
            ->orderByDesc('captured_at')
            ->first();

        if ($latestSnapshot === null) {
            return 0.0;
        }

        $billingPeriodStartsAt = $latestSnapshot->billing_period_starts_at;
        $elapsedDays = $billingPeriodStartsAt === null
            ? max(1, $latestSnapshot->captured_at->day)
            : max(1, $latestSnapshot->captured_at->diffInDays($billingPeriodStartsAt) + 1);
        $spendCents = (int) ($latestSnapshot->current_spend_cents ?: $latestSnapshot->month_to_date_spend_cents);

        return round($spendCents / $elapsedDays, 2);
    }

    /**
     * Calculate minutes since the latest Railway billing snapshot.
     */
    protected function calculateSnapshotAgeMinutes(): int
    {
        $latestSnapshot = RailwayBillingSnapshot::query()
            ->orderByDesc('captured_at')
            ->first();

        if ($latestSnapshot === null) {
            return PHP_INT_MAX;
        }

        return $latestSnapshot->captured_at->diffInMinutes(now());
    }
}
