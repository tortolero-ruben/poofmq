<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sandbox\StoreSandboxQueueRequest;
use App\Services\TurnstileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class SandboxQueueController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        protected TurnstileService $turnstileService
    ) {}

    /**
     * Store a newly created sandbox queue.
     */
    public function store(StoreSandboxQueueRequest $request): JsonResponse
    {
        if (! $request->verifyTurnstile($this->turnstileService)) {
            return response()->json([
                'message' => 'Turnstile verification failed.',
            ], 422);
        }

        $queueId = (string) Str::uuid();

        return response()->json([
            'queue_id' => $queueId,
            'queue_url' => config('app.url').'/queues/'.$queueId,
        ], 201);
    }
}
