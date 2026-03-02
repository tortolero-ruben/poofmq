<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class SyncApiKeyToRedis implements ShouldQueue
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
        public string $apiKeyId,
        public string $keyPrefix,
        public string $keyHash,
        public int $userId,
        public ?int $expiresAtTimestamp = null,
        public ?string $projectId = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $redisKey = $this->buildRedisKey();
        $ttl = $this->calculateTtl();
        $data = $this->buildKeyData();

        try {
            Redis::connection()->client()->setex(
                $redisKey,
                $ttl,
                json_encode($data, JSON_THROW_ON_ERROR)
            );

            Log::info('API key synced to Redis', [
                'key_prefix' => $this->keyPrefix,
                'user_id' => $this->userId,
                'project_id' => $this->projectId,
                'ttl' => $ttl,
                'expires_at' => $this->expiresAtTimestamp,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to sync API key to Redis', [
                'key_prefix' => $this->keyPrefix,
                'user_id' => $this->userId,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Build the Redis key for the API key.
     */
    protected function buildRedisKey(): string
    {
        $root = config('poofmq.redis_namespace_root');
        $auth = config('poofmq.redis_auth_namespace');

        return "{$root}:{$auth}:apikey:{$this->keyPrefix}";
    }

    /**
     * Calculate the TTL for the Redis key.
     *
     * From ADR-0001: TTL = (expires_at - now) + 300 seconds (skew buffer)
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
     * Build the data array to store in Redis.
     *
     * @return array{key_hash: string, user_id: int, project_id: string|null, expires_at: int|null}
     */
    protected function buildKeyData(): array
    {
        return [
            'key_hash' => $this->keyHash,
            'user_id' => $this->userId,
            'project_id' => $this->projectId,
            'expires_at' => $this->expiresAtTimestamp,
        ];
    }

    /**
     * Get the tags that should be assigned to the job.
     *
     * @return array<int, string>
     */
    public function tags(): array
    {
        return [
            'api_key:'.$this->apiKeyId,
            'user:'.$this->userId,
        ];
    }
}
