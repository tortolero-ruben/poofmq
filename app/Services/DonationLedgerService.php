<?php

namespace App\Services;

use App\Models\DonationLedgerEntry;
use Illuminate\Support\Collection;

class DonationLedgerService
{
    /**
     * Record a donation ledger event idempotently.
     *
     * @param  array{
     *     provider: string,
     *     provider_event_id: string,
     *     event_type: string,
     *     amount_cents: int,
     *     currency: string,
     *     happened_at: string,
     *     donor_name?: string|null,
     *     donor_email?: string|null,
     *     metadata?: array<string, mixed>|null
     * }  $attributes
     * @return array{entry: DonationLedgerEntry, already_processed: bool}
     */
    public function recordEvent(array $attributes): array
    {
        $existing = DonationLedgerEntry::query()
            ->where('provider', $attributes['provider'])
            ->where('provider_event_id', $attributes['provider_event_id'])
            ->first();

        if ($existing !== null) {
            return [
                'entry' => $existing,
                'already_processed' => true,
            ];
        }

        $entry = DonationLedgerEntry::query()->create([
            'provider' => $attributes['provider'],
            'provider_event_id' => $attributes['provider_event_id'],
            'event_type' => $attributes['event_type'],
            'amount_cents' => $attributes['amount_cents'],
            'currency' => strtoupper($attributes['currency']),
            'happened_at' => $attributes['happened_at'],
            'donor_name' => $attributes['donor_name'] ?? null,
            'donor_email' => $attributes['donor_email'] ?? null,
            'metadata' => $attributes['metadata'] ?? null,
        ]);

        return [
            'entry' => $entry,
            'already_processed' => false,
        ];
    }

    /**
     * Return aggregate funding statistics.
     *
     * @return array{
     *     gross_donations_cents: int,
     *     refunds_cents: int,
     *     net_funding_cents: int,
     *     event_count: int
     * }
     */
    public function summary(): array
    {
        $baseQuery = DonationLedgerEntry::query();

        $grossDonations = (clone $baseQuery)->where('amount_cents', '>', 0)->sum('amount_cents');
        $negativeTotal = (clone $baseQuery)->where('amount_cents', '<', 0)->sum('amount_cents');
        $netFunding = (clone $baseQuery)->sum('amount_cents');

        return [
            'gross_donations_cents' => (int) $grossDonations,
            'refunds_cents' => (int) abs((int) $negativeTotal),
            'net_funding_cents' => (int) $netFunding,
            'event_count' => (int) DonationLedgerEntry::query()->count(),
        ];
    }

    /**
     * Return recent donation ledger entries for dashboard history.
     *
     * @return list<array{
     *     id: string,
     *     provider: string,
     *     provider_event_id: string,
     *     event_type: string,
     *     amount_cents: int,
     *     currency: string,
     *     donor_name: string|null,
     *     happened_at: string
     * }>
     */
    public function recentEntries(int $limit = 10): array
    {
        /** @var Collection<int, DonationLedgerEntry> $entries */
        $entries = DonationLedgerEntry::query()
            ->orderByDesc('happened_at')
            ->limit($limit)
            ->get();

        return $entries->map(fn (DonationLedgerEntry $entry) => [
            'id' => $entry->id,
            'provider' => $entry->provider,
            'provider_event_id' => $entry->provider_event_id,
            'event_type' => $entry->event_type,
            'amount_cents' => (int) $entry->amount_cents,
            'currency' => $entry->currency,
            'donor_name' => $entry->donor_name,
            'happened_at' => $entry->happened_at->toIso8601String(),
        ])->values()->all();
    }
}
