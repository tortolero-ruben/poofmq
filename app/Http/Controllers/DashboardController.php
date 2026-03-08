<?php

namespace App\Http\Controllers;

use App\Services\CapacityLimitService;
use App\Services\FundingStatusService;
use App\Services\ObservabilityService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        public FundingStatusService $fundingStatusService,
        public CapacityLimitService $capacityLimitService,
        public ObservabilityService $observabilityService
    ) {}

    /**
     * Display the dashboard page.
     */
    public function index(Request $request): Response
    {
        $fundingStatus = $this->fundingStatusService->buildPublic();
        $isAdmin = $request->user()?->isAdmin() ?? false;

        return Inertia::render('dashboard', [
            'funding' => $fundingStatus['funding'],
            'billing' => $fundingStatus['billing'],
            'admin' => $isAdmin ? [
                'capacity' => $this->capacityLimitService->resolveGlobalLimit(),
                'observability' => $this->observabilityService->collect(),
            ] : null,
        ]);
    }
}
