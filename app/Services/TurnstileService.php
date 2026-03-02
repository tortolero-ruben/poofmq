<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class TurnstileService
{
    /**
     * Create a new class instance.
     */
    public function __construct(
        protected ?string $secretKey,
        protected string $verifyUrl
    ) {}

    /**
     * Verify a Turnstile token with Cloudflare.
     */
    public function verify(string $token, ?string $clientIp = null): bool
    {
        if ($this->secretKey === null) {
            return false;
        }

        $data = [
            'secret' => $this->secretKey,
            'response' => $token,
        ];

        if ($clientIp !== null) {
            $data['remoteip'] = $clientIp;
        }

        $response = Http::asForm()
            ->timeout(10)
            ->post($this->verifyUrl, $data);

        if (! $response->successful()) {
            return false;
        }

        return (bool) $response->json('success', false);
    }

    /**
     * Create a new instance from config.
     */
    public static function fromConfig(): self
    {
        return new self(
            secretKey: config('services.turnstile.secret_key'),
            verifyUrl: config('services.turnstile.verify_url')
        );
    }
}
