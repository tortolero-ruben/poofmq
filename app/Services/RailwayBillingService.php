<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class RailwayBillingService
{
    /**
     * Fetch latest billing summary from Railway.
     *
     * @return array{
     *     balance_cents: int,
     *     month_to_date_spend_cents: int,
     *     captured_at: string,
     *     raw_payload: array<string, mixed>
     * }
     */
    public function fetchSummary(): array
    {
        $apiToken = config('services.railway.api_token');
        $projectId = config('services.railway.project_id');
        $endpoint = config('services.railway.billing_endpoint');

        if (! is_string($apiToken) || $apiToken === '' || ! is_string($projectId) || $projectId === '' || ! is_string($endpoint) || $endpoint === '') {
            throw new \RuntimeException('Railway billing API credentials are not configured.');
        }

        $response = Http::withToken($apiToken)
            ->acceptJson()
            ->timeout((int) config('services.railway.timeout_seconds', 10))
            ->get($endpoint, [
                'project_id' => $projectId,
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Unable to fetch Railway billing summary.');
        }

        /** @var array<string, mixed> $payload */
        $payload = $response->json();

        $balanceCents = $this->normalizeCents(data_get($payload, 'balance_cents', data_get($payload, 'balance')));
        $monthToDateSpendCents = $this->normalizeCents(data_get($payload, 'month_to_date_spend_cents', data_get($payload, 'spend.month_to_date_cents', data_get($payload, 'month_to_date_spend'))));
        $capturedAt = data_get($payload, 'captured_at', now()->toIso8601String());

        return [
            'balance_cents' => $balanceCents,
            'month_to_date_spend_cents' => $monthToDateSpendCents,
            'captured_at' => is_string($capturedAt) ? $capturedAt : now()->toIso8601String(),
            'raw_payload' => $payload,
        ];
    }

    /**
     * Normalize integer-cents values from API payloads.
     */
    protected function normalizeCents(mixed $value): int
    {
        if (is_int($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            $numeric = (string) $value;

            if (str_contains($numeric, '.')) {
                return (int) round(((float) $value) * 100);
            }

            return (int) $value;
        }

        return 0;
    }
}
