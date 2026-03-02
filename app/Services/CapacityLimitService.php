<?php

namespace App\Services;

use App\Models\ActiveMonthBoost;

class CapacityLimitService
{
    /**
     * Resolve effective global throughput limits with optional boost override.
     *
     * @return array{
     *     base_limit_per_minute: int,
     *     effective_limit_per_minute: int,
     *     is_boost_active: bool,
     *     boost_multiplier: int|null,
     *     boost_expires_at: string|null
     * }
     */
    public function resolveGlobalLimit(): array
    {
        $baseLimit = (int) config('poofmq_capacity.base_global_limit_per_minute', 60);
        $boostEnabled = (bool) config('poofmq_capacity.active_month_boost_enabled', false);

        if (! $boostEnabled) {
            return [
                'base_limit_per_minute' => $baseLimit,
                'effective_limit_per_minute' => $baseLimit,
                'is_boost_active' => false,
                'boost_multiplier' => null,
                'boost_expires_at' => null,
            ];
        }

        $activeBoost = ActiveMonthBoost::query()
            ->whereNull('deactivated_at')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->orderByDesc('ends_at')
            ->first();

        if ($activeBoost === null) {
            return [
                'base_limit_per_minute' => $baseLimit,
                'effective_limit_per_minute' => $baseLimit,
                'is_boost_active' => false,
                'boost_multiplier' => null,
                'boost_expires_at' => null,
            ];
        }

        $multiplier = max(1, (int) $activeBoost->multiplier);

        return [
            'base_limit_per_minute' => $baseLimit,
            'effective_limit_per_minute' => $baseLimit * $multiplier,
            'is_boost_active' => true,
            'boost_multiplier' => $multiplier,
            'boost_expires_at' => $activeBoost->ends_at->toIso8601String(),
        ];
    }
}
