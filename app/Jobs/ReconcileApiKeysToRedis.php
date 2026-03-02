<?php

namespace App\Jobs;

use App\Models\ApiKey;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class ReconcileApiKeysToRedis
{
    use Queueable;

    /**
     * The number of records to process per chunk.
     */
    protected int $chunkSize = 100;

    /**
     * Counters for reconciliation summary.
     */
    protected int $totalKeys = 0;

    protected int $syncedKeys = 0;

    protected int $deletedKeys = 0;

    protected int $errorCount = 0;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('API key reconciliation started');

        $this->reconcileActiveKeys();
        $this->cleanupRevokedKeys();

        Log::info('API key reconciliation completed', [
            'total_keys' => $this->totalKeys,
            'synced' => $this->syncedKeys,
            'deleted' => $this->deletedKeys,
            'errors' => $this->errorCount,
        ]);
    }

    /**
     * Reconcile active API keys to Redis.
     */
    protected function reconcileActiveKeys(): void
    {
        ApiKey::query()
            ->active()
            ->chunkById($this->chunkSize, function ($apiKeys) {
                foreach ($apiKeys as $apiKey) {
                    $this->totalKeys++;

                    try {
                        $this->syncApiKeyToRedis($apiKey);
                        $this->syncedKeys++;
                    } catch (\Throwable $e) {
                        $this->errorCount++;
                        Log::error('Failed to reconcile API key', [
                            'api_key_id' => $apiKey->id,
                            'key_prefix' => $apiKey->key_prefix,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            });
    }

    /**
     * Clean up revoked/expired keys from Redis.
     */
    protected function cleanupRevokedKeys(): void
    {
        $redis = Redis::connection()->client();
        $pattern = $this->buildRedisKeyPattern();

        try {
            $iterator = null;
            while (($keys = $redis->scan($iterator, ['match' => $pattern, 'count' => 100])) !== false) {
                foreach ($keys as $redisKey) {
                    $keyPrefix = $this->extractKeyPrefix($redisKey);

                    if ($keyPrefix === null) {
                        continue;
                    }

                    // Check if this key should exist in Redis (active in database)
                    $activeKeyExists = ApiKey::query()
                        ->where('key_prefix', $keyPrefix)
                        ->active()
                        ->exists();

                    if (! $activeKeyExists) {
                        try {
                            $redis->del($redisKey);
                            $this->deletedKeys++;

                            Log::info('Removed orphaned API key from Redis', [
                                'key_prefix' => $keyPrefix,
                                'redis_key' => $redisKey,
                            ]);
                        } catch (\Throwable $e) {
                            $this->errorCount++;
                            Log::error('Failed to delete orphaned API key from Redis', [
                                'key_prefix' => $keyPrefix,
                                'redis_key' => $redisKey,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }
                }

                if ($iterator === 0) {
                    break;
                }
            }
        } catch (\Throwable $e) {
            $this->errorCount++;
            Log::error('Failed to scan Redis keys during reconciliation', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Sync an API key to Redis.
     */
    protected function syncApiKeyToRedis(ApiKey $apiKey): void
    {
        $redisKey = $this->buildRedisKey($apiKey->key_prefix);
        $ttl = $this->calculateTtl($apiKey);
        $data = $this->buildKeyData($apiKey);

        Redis::connection()->client()->setex(
            $redisKey,
            $ttl,
            json_encode($data, JSON_THROW_ON_ERROR)
        );
    }

    /**
     * Build the Redis key for an API key.
     */
    protected function buildRedisKey(string $keyPrefix): string
    {
        $root = config('poofmq.redis_namespace_root');
        $auth = config('poofmq.redis_auth_namespace');

        return "{$root}:{$auth}:apikey:{$keyPrefix}";
    }

    /**
     * Build the Redis key pattern for scanning.
     */
    protected function buildRedisKeyPattern(): string
    {
        $root = config('poofmq.redis_namespace_root');
        $auth = config('poofmq.redis_auth_namespace');

        return "{$root}:{$auth}:apikey:*";
    }

    /**
     * Extract the key prefix from a Redis key.
     */
    protected function extractKeyPrefix(string $redisKey): ?string
    {
        $root = config('poofmq.redis_namespace_root');
        $auth = config('poofmq.redis_auth_namespace');
        $prefix = "{$root}:{$auth}:apikey:";

        if (! str_starts_with($redisKey, $prefix)) {
            return null;
        }

        return substr($redisKey, strlen($prefix));
    }

    /**
     * Calculate the TTL for the Redis key.
     */
    protected function calculateTtl(ApiKey $apiKey): int
    {
        $skewBuffer = config('poofmq.auth_key_ttl_skew_buffer', 300);
        $defaultTtl = config('poofmq.default_auth_key_ttl', 31536000);

        if ($apiKey->expires_at === null) {
            return $defaultTtl + $skewBuffer;
        }

        $now = now()->timestamp;
        $ttl = ($apiKey->expires_at->timestamp - $now) + $skewBuffer;

        // Ensure minimum TTL of 60 seconds
        return max(60, $ttl);
    }

    /**
     * Build the data array to store in Redis.
     *
     * @return array{key_hash: string, user_id: int, expires_at: int|null}
     */
    protected function buildKeyData(ApiKey $apiKey): array
    {
        return [
            'key_hash' => $apiKey->key_hash,
            'user_id' => $apiKey->user_id,
            'expires_at' => $apiKey->expires_at?->timestamp,
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
            'reconciliation',
            'api_keys',
        ];
    }
}
