<?php

namespace App\Http\Controllers;

use App\Models\RailwayBillingSnapshot;
use App\Services\CapacityLimitService;
use App\Services\DonationLedgerService;
use App\Services\ObservabilityService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        public DonationLedgerService $donationLedgerService,
        public CapacityLimitService $capacityLimitService,
        public ObservabilityService $observabilityService
    ) {}

    /**
     * Display the dashboard page.
     */
    public function index(): Response
    {
        $billing = $this->buildBillingPayload();

        return Inertia::render('dashboard', [
            'funding' => [
                'summary' => $this->donationLedgerService->summary(),
                'history' => $this->donationLedgerService->recentEntries(),
            ],
            'billing' => $billing,
            'capacity' => $this->capacityLimitService->resolveGlobalLimit(),
            'observability' => $this->observabilityService->collect(),
        ]);
    }

    /**
     * Build billing snapshot payload for dashboard rendering.
     *
     * @return array{
     *     latest: array{balance_cents: int, month_to_date_spend_cents: int, runway_months: float, captured_at: string}|null,
     *     trend: array{balance_delta_cents: int, spend_delta_cents: int}
     * }
     */
    protected function buildBillingPayload(): array
    {
        $snapshots = RailwayBillingSnapshot::query()
            ->orderByDesc('captured_at')
            ->limit(2)
            ->get();

        /** @var RailwayBillingSnapshot|null $latest */
        $latest = $snapshots->first();

        /** @var RailwayBillingSnapshot|null $previous */
        $previous = $snapshots->skip(1)->first();

        if ($latest === null) {
            return [
                'latest' => null,
                'trend' => [
                    'balance_delta_cents' => 0,
                    'spend_delta_cents' => 0,
                ],
            ];
        }

        return [
            'latest' => [
                'balance_cents' => (int) $latest->balance_cents,
                'month_to_date_spend_cents' => (int) $latest->month_to_date_spend_cents,
                'runway_months' => (float) $latest->runway_months,
                'captured_at' => $latest->captured_at->toIso8601String(),
            ],
            'trend' => [
                'balance_delta_cents' => (int) $latest->balance_cents - (int) ($previous?->balance_cents ?? 0),
                'spend_delta_cents' => (int) $latest->month_to_date_spend_cents - (int) ($previous?->month_to_date_spend_cents ?? 0),
            ],
        ];
    }
}
