<?php

namespace Database\Factories;

use App\Models\RailwayBillingSnapshot;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RailwayBillingSnapshot>
 */
class RailwayBillingSnapshotFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Models\RailwayBillingSnapshot>
     */
    protected $model = RailwayBillingSnapshot::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $balance = fake()->numberBetween(500, 5000);
        $monthlySpend = fake()->numberBetween(100, 1200);

        return [
            'balance_cents' => $balance,
            'month_to_date_spend_cents' => $monthlySpend,
            'runway_months' => round($balance / 500, 2),
            'captured_at' => now()->subMinutes(fake()->numberBetween(1, 120)),
            'raw_payload' => [
                'balance_cents' => $balance,
                'month_to_date_spend_cents' => $monthlySpend,
            ],
        ];
    }
}
