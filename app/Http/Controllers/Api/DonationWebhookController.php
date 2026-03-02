<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDonationWebhookRequest;
use App\Services\DonationLedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DonationWebhookController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        public DonationLedgerService $donationLedgerService
    ) {}

    /**
     * Store an incoming donation webhook event.
     */
    public function store(StoreDonationWebhookRequest $request): JsonResponse
    {
        if (! $this->hasValidSignature($request)) {
            return response()->json([
                'message' => 'Invalid webhook signature.',
            ], 401);
        }

        $result = $this->donationLedgerService->recordEvent($request->validated());
        $entry = $result['entry'];
        $status = $result['already_processed'] ? 200 : 201;

        return response()->json([
            'already_processed' => $result['already_processed'],
            'entry' => [
                'id' => $entry->id,
                'provider' => $entry->provider,
                'provider_event_id' => $entry->provider_event_id,
                'event_type' => $entry->event_type,
                'amount_cents' => (int) $entry->amount_cents,
                'currency' => $entry->currency,
                'happened_at' => $entry->happened_at->toIso8601String(),
            ],
        ], $status);
    }

    /**
     * Validate request signature for webhook authenticity.
     */
    protected function hasValidSignature(Request $request): bool
    {
        $sharedSecret = config('services.donations.webhook_secret');
        $signature = (string) $request->header('X-PoofMQ-Signature', '');

        if (! is_string($sharedSecret) || $sharedSecret === '' || $signature === '') {
            return false;
        }

        $expectedSignature = hash_hmac('sha256', (string) $request->getContent(), $sharedSecret);

        return hash_equals($expectedSignature, $signature);
    }
}
