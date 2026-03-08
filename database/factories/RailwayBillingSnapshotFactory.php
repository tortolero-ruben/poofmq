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
            'current_spend_cents' => $monthlySpend,
            'estimated_spend_cents' => (int) round($monthlySpend * 1.35),
            'poofmq_attributed_current_spend_cents' => (int) round($monthlySpend * 0.85),
            'poofmq_attributed_estimated_spend_cents' => (int) round($monthlySpend * 1.1),
            'credit_balance_cents' => fake()->numberBetween(0, 1000),
            'applied_credits_cents' => fake()->numberBetween(0, 250),
            'latest_invoice_total_cents' => fake()->numberBetween(500, 2500),
            'funding_gap_cents' => fake()->numberBetween(0, 1000),
            'runway_months' => round($balance / 500, 2),
            'captured_at' => now()->subMinutes(fake()->numberBetween(1, 120)),
            'billing_period_starts_at' => now()->startOfMonth(),
            'billing_period_ends_at' => now()->endOfMonth(),
            'snapshot_source' => 'railway_graphql',
            'raw_payload' => [
                'balance_cents' => $balance,
                'current_usage' => [],
                'estimated_usage' => [],
            ],
        ];
    }
}
