<?php

namespace App\Services;

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
    public function generate(User $user, string $name, ?\DateTimeInterface $expiresAt = null): array
    {
        $plainTextKey = $this->generateRawKey();
        $keyPrefix = $this->extractPrefix($plainTextKey);
        $keyHash = $this->hashKey($plainTextKey);

        $apiKey = DB::transaction(function () use ($user, $name, $keyPrefix, $keyHash, $expiresAt) {
            return ApiKey::create([
                'user_id' => $user->id,
                'name' => $name,
                'key_prefix' => $keyPrefix,
                'key_hash' => $keyHash,
                'expires_at' => $expiresAt,
            ]);
        });

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

        return $apiKey->update([
            'revoked_at' => now(),
            'revoked_by' => $revoker->id,
        ]);
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
