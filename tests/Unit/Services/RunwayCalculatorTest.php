<?php

use App\Services\RunwayCalculator;
use Tests\TestCase;

uses(TestCase::class);

it('calculates runway months deterministically from balance and monthly budget', function () {
    $months = app(RunwayCalculator::class)->months(
        balanceCents: 2500,
        targetMonthlyBudgetCents: 500,
    );

    expect($months)->toBe(5.0);
});

it('returns zero runway when target monthly budget is zero or negative', function () {
    $calculator = app(RunwayCalculator::class);

    expect($calculator->months(balanceCents: 5000, targetMonthlyBudgetCents: 0))->toBe(0.0)
        ->and($calculator->months(balanceCents: 5000, targetMonthlyBudgetCents: -100))->toBe(0.0);
});
