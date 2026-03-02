<?php

namespace App\Services;

class RunwayCalculator
{
    /**
     * Compute funded runway months from current balance and budget.
     */
    public function months(int $balanceCents, int $targetMonthlyBudgetCents): float
    {
        if ($targetMonthlyBudgetCents <= 0 || $balanceCents <= 0) {
            return 0.0;
        }

        return round($balanceCents / $targetMonthlyBudgetCents, 2);
    }
}
