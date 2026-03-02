<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class RevokeApiKeyInRedis implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public array $backoff = [5, 30, 60];

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $keyPrefix,
        public int $userId,
        public ?int $expiresAtTimestamp = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $activeKey = $this->buildActiveKey();
        $revokeKey = $this->buildRevokeKey();
        $ttl = $this->calculateTtl();

        try {
            $redis = Redis::connection()->client();

            // Remove the active key
            $redis->del($activeKey);

            // Set the revocation marker with the same TTL as the original key
            $revokeData = [
                'revoked_at' => now()->timestamp,
                'user_id' => $this->userId,
            ];
            $redis->setex($revokeKey, $ttl, json_encode($revokeData, JSON_THROW_ON_ERROR));

            Log::info('API key revoked in Redis', [
                'key_prefix' => $this->keyPrefix,
                'user_id' => $this->userId,
                'ttl' => $ttl,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to revoke API key in Redis', [
                'key_prefix' => $this->keyPrefix,
                'user_id' => $this->userId,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Build the Redis key for the active API key.
     */
    protected function buildActiveKey(): string
    {
        $root = config('poofmq.redis_namespace_root');
        $auth = config('poofmq.redis_auth_namespace');

        return "{$root}:{$auth}:apikey:{$this->keyPrefix}";
    }

    /**
     * Build the Redis key for the revocation marker.
     */
    protected function buildRevokeKey(): string
    {
        $root = config('poofmq.redis_namespace_root');
        $auth = config('poofmq.redis_auth_namespace');

        return "{$root}:{$auth}:revoke:apikey:{$this->keyPrefix}";
    }

    /**
     * Calculate the TTL for the revocation marker.
     *
     * From ADR-0001: Revocation marker TTL should be at least
     * (token_expiry - current_time) + 300 seconds
     */
    protected function calculateTtl(): int
    {
        $skewBuffer = config('poofmq.auth_key_ttl_skew_buffer', 300);
        $defaultTtl = config('poofmq.default_auth_key_ttl', 31536000);

        if ($this->expiresAtTimestamp === null) {
            return $defaultTtl + $skewBuffer;
        }

        $now = now()->timestamp;
        $ttl = ($this->expiresAtTimestamp - $now) + $skewBuffer;

        // Ensure minimum TTL of 60 seconds
        return max(60, $ttl);
    }

    /**
     * Get the tags that should be assigned to the job.
     *
     * @return array<int, string>
     */
    public function tags(): array
    {
        return [
            'api_key_prefix:'.$this->keyPrefix,
            'user:'.$this->userId,
        ];
    }
}
