<?php

namespace App\Services;

class ObservabilityAlertService
{
    /**
     * Evaluate observability metrics against configured thresholds.
     *
     * @param  array{
     *     error_rate_percent: float,
     *     avg_push_latency_ms: float,
     *     avg_pop_latency_ms: float,
     *     redis_memory_bytes: int,
     *     burn_rate_cents_per_day: float
     * }  $metrics
     * @return list<array{key: string, severity: string, message: string, runbook: string}>
     */
    public function evaluate(array $metrics): array
    {
        $thresholds = config('observability.thresholds');
        $alerts = [];

        if ((float) $metrics['error_rate_percent'] > (float) ($thresholds['error_rate_percent'] ?? 0)) {
            $alerts[] = $this->buildAlert(
                key: 'error_rate_percent',
                severity: 'critical',
                message: sprintf('Error rate is %.2f%%.', $metrics['error_rate_percent'])
            );
        }

        if ((float) $metrics['avg_push_latency_ms'] > (float) ($thresholds['push_latency_ms'] ?? 0)) {
            $alerts[] = $this->buildAlert(
                key: 'push_latency_ms',
                severity: 'warning',
                message: sprintf('Average push latency is %.2fms.', $metrics['avg_push_latency_ms'])
            );
        }

        if ((float) $metrics['avg_pop_latency_ms'] > (float) ($thresholds['pop_latency_ms'] ?? 0)) {
            $alerts[] = $this->buildAlert(
                key: 'pop_latency_ms',
                severity: 'warning',
                message: sprintf('Average pop latency is %.2fms.', $metrics['avg_pop_latency_ms'])
            );
        }

        if ((int) $metrics['redis_memory_bytes'] > (int) ($thresholds['redis_memory_bytes'] ?? 0)) {
            $alerts[] = $this->buildAlert(
                key: 'redis_memory_bytes',
                severity: 'warning',
                message: sprintf('Redis memory usage is %d bytes.', $metrics['redis_memory_bytes'])
            );
        }

        if ((float) $metrics['burn_rate_cents_per_day'] > (float) ($thresholds['burn_rate_cents_per_day'] ?? 0)) {
            $alerts[] = $this->buildAlert(
                key: 'burn_rate_cents_per_day',
                severity: 'warning',
                message: sprintf('Burn rate is %.2f cents/day.', $metrics['burn_rate_cents_per_day'])
            );
        }

        return $alerts;
    }

    /**
     * Build a single alert payload with runbook guidance.
     *
     * @return array{key: string, severity: string, message: string, runbook: string}
     */
    protected function buildAlert(string $key, string $severity, string $message): array
    {
        $runbook = (string) config("observability.runbooks.{$key}", 'Review service logs and investigate anomalies.');

        return [
            'key' => $key,
            'severity' => $severity,
            'message' => $message,
            'runbook' => $runbook,
        ];
    }
}
