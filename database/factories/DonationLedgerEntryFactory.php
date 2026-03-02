<?php

namespace Database\Factories;

use App\Models\DonationLedgerEntry;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DonationLedgerEntry>
 */
class DonationLedgerEntryFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Models\DonationLedgerEntry>
     */
    protected $model = DonationLedgerEntry::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'provider' => fake()->randomElement(['github_sponsors', 'buymeacoffee']),
            'provider_event_id' => fake()->unique()->regexify('evt_[A-Za-z0-9]{12}'),
            'event_type' => fake()->randomElement(['donation_received', 'refund_issued']),
            'amount_cents' => fake()->randomElement([500, 1000, 1500, -300]),
            'currency' => 'USD',
            'donor_name' => fake()->name(),
            'donor_email' => fake()->safeEmail(),
            'metadata' => [
                'note' => fake()->sentence(4),
            ],
            'happened_at' => now()->subMinutes(fake()->numberBetween(1, 180)),
        ];
    }
}
