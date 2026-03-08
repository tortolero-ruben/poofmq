<?php

namespace App\Http\Controllers;

use App\Services\FundingStatusService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FundingController extends Controller
{
    public function __construct(
        public FundingStatusService $fundingStatusService
    ) {}

    public function index(): Response
    {
        return Inertia::render('funding/index', $this->fundingStatusService->buildPublic());
    }

    public function admin(Request $request): Response
    {
        abort_unless($request->user()?->can('viewAdminFunding') ?? false, 403);

        return Inertia::render('funding/admin', $this->fundingStatusService->buildAdmin());
    }
}
