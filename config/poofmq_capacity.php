<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Capacity Bank Budget Baseline
    |--------------------------------------------------------------------------
    |
    | The default monthly infrastructure budget target for runway calculations.
    | Values are stored in integer cents to keep accounting deterministic.
    |
    */
    'monthly_budget_cents' => (int) env('POOFMQ_MONTHLY_BUDGET_CENTS', 500),

    /*
    |--------------------------------------------------------------------------
    | Global Throughput Limits
    |--------------------------------------------------------------------------
    |
    | Base limit settings used by launch-capacity controls. Sprint 6 introduces
    | optional Active Month Boost overrides controlled via these values.
    |
    */
    'base_global_limit_per_minute' => (int) env('POOFMQ_BASE_GLOBAL_LIMIT_PER_MINUTE', 60),
    'active_month_boost_enabled' => (bool) env('POOFMQ_ACTIVE_MONTH_BOOST_ENABLED', false),
    'active_month_boost_multiplier' => (int) env('POOFMQ_ACTIVE_MONTH_BOOST_MULTIPLIER', 2),
];
