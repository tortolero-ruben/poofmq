<?php

namespace App\Services;

use App\Jobs\RevokeApiKeyInRedis;
use App\Jobs\SyncApiKeyToRedis;
use App\Models\ApiKey;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Random\RandomException;

class ApiKeyService
{
    /**
     * Generate a new API key for the given user.
     *
     * @return array{api_key: ApiKey, plain_text_key: string}
     *
     * @throws RandomException
     */
    public function generate(
        User $user,
        string $name,
        ?\DateTimeInterface $expiresAt = null,
        ?string $projectId = null
    ): array {
        $plainTextKey = $this->generateRawKey();
        $keyPrefix = $this->extractPrefix($plainTextKey);
        $keyHash = $this->hashKey($plainTextKey);

        $apiKey = DB::transaction(function () use ($user, $projectId, $name, $keyPrefix, $keyHash, $expiresAt) {
            return ApiKey::create([
                'user_id' => $user->id,
                'project_id' => $projectId,
                'name' => $name,
                'key_prefix' => $keyPrefix,
                'key_hash' => $keyHash,
                'expires_at' => $expiresAt,
            ]);
        });

        // Dispatch job to sync API key to Redis
        SyncApiKeyToRedis::dispatch(
            apiKeyId: $apiKey->id,
            keyPrefix: $keyPrefix,
            keyHash: $keyHash,
            userId: $user->id,
            expiresAtTimestamp: $expiresAt?->getTimestamp(),
            projectId: $projectId
        );

        return [
            'api_key' => $apiKey,
            'plain_text_key' => $plainTextKey,
        ];
    }

    /**
     * Verify an API key and return the associated model.
     */
    public function verify(string $plainTextKey): ?ApiKey
    {
        $keyPrefix = $this->extractPrefix($plainTextKey);
        $keyHash = $this->hashKey($plainTextKey);

        $apiKey = ApiKey::query()
            ->where('key_prefix', $keyPrefix)
            ->where('key_hash', $keyHash)
            ->first();

        if ($apiKey === null || ! $apiKey->isValid()) {
            return null;
        }

        return $apiKey;
    }

    /**
     * Revoke an API key.
     */
    public function revoke(ApiKey $apiKey, User $revoker): bool
    {
        if ($apiKey->isRevoked()) {
            return false;
        }

        $updated = $apiKey->update([
            'revoked_at' => now(),
            'revoked_by' => $revoker->id,
        ]);

        if ($updated) {
            // Dispatch job to revoke API key in Redis
            RevokeApiKeyInRedis::dispatch(
                keyPrefix: $apiKey->key_prefix,
                userId: $apiKey->user_id,
                expiresAtTimestamp: $apiKey->expires_at?->getTimestamp()
            );
        }

        return $updated;
    }

    /**
     * Generate a raw API key with prefix.
     *
     * @throws RandomException
     */
    public function generateRawKey(): string
    {
        $randomBytes = random_bytes(ApiKey::KEY_BYTES);
        $encoded = Str::substr(base64_encode($randomBytes), 0, 43);
        $encoded = strtr($encoded, '+/', '-_');

        return ApiKey::PREFIX.$encoded;
    }

    /**
     * Extract the prefix from a raw key for lookup.
     */
    public function extractPrefix(string $plainTextKey): string
    {
        $withoutPrefix = Str::after($plainTextKey, ApiKey::PREFIX);

        return Str::substr($withoutPrefix, 0, ApiKey::PREFIX_LENGTH);
    }

    /**
     * Hash a raw API key for storage.
     */
    public function hashKey(string $plainTextKey): string
    {
        return hash('sha256', $plainTextKey);
    }
}
