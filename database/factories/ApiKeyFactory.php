<?php

namespace Database\Factories;

use App\Models\ApiKey;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Random\RandomException;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ApiKey>
 */
class ApiKeyFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Models\ApiKey>
     */
    protected $model = ApiKey::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     *
     * @throws RandomException
     */
    public function definition(): array
    {
        $plainTextKey = $this->generateRawKey();
        $keyPrefix = Str::substr(Str::after($plainTextKey, ApiKey::PREFIX), 0, ApiKey::PREFIX_LENGTH);
        $keyHash = hash('sha256', $plainTextKey);

        return [
            'user_id' => User::factory(),
            'name' => fake()->words(3, true),
            'key_prefix' => $keyPrefix,
            'key_hash' => $keyHash,
            'expires_at' => null,
            'revoked_at' => null,
            'revoked_by' => null,
        ];
    }

    /**
     * Generate a raw API key with prefix.
     *
     * @throws RandomException
     */
    protected function generateRawKey(): string
    {
        $randomBytes = random_bytes(ApiKey::KEY_BYTES);
        $encoded = Str::substr(base64_encode($randomBytes), 0, 43);
        $encoded = strtr($encoded, '+/', '-_');

        return ApiKey::PREFIX.$encoded;
    }

    /**
     * Indicate that the API key is expired.
     */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->subDay(),
        ]);
    }

    /**
     * Indicate that the API key is revoked.
     */
    public function revoked(): static
    {
        return $this->state(fn (array $attributes) => [
            'revoked_at' => now(),
            'revoked_by' => User::factory(),
        ]);
    }

    /**
     * Indicate that the API key expires in the future.
     */
    public function expiresSoon(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->addDays(7),
        ]);
    }
}
