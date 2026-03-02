<?php

namespace Database\Factories;

use App\Models\ActiveMonthBoost;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ActiveMonthBoost>
 */
class ActiveMonthBoostFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Models\ActiveMonthBoost>
     */
    protected $model = ActiveMonthBoost::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'multiplier' => fake()->randomElement([2, 3]),
            'starts_at' => now()->subHour(),
            'ends_at' => now()->addDay(),
            'activated_by' => null,
            'deactivated_at' => null,
            'notes' => fake()->optional()->sentence(5),
        ];
    }
}
