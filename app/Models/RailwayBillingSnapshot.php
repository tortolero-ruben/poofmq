<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RailwayBillingSnapshot extends Model
{
    /** @use HasFactory<\Database\Factories\RailwayBillingSnapshotFactory> */
    use HasFactory, HasUlids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'balance_cents',
        'month_to_date_spend_cents',
        'current_spend_cents',
        'estimated_spend_cents',
        'poofmq_attributed_current_spend_cents',
        'poofmq_attributed_estimated_spend_cents',
        'credit_balance_cents',
        'applied_credits_cents',
        'latest_invoice_total_cents',
        'funding_gap_cents',
        'runway_months',
        'snapshot_source',
        'raw_payload',
        'captured_at',
        'billing_period_starts_at',
        'billing_period_ends_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'raw_payload' => 'array',
            'captured_at' => 'immutable_datetime',
            'billing_period_starts_at' => 'immutable_datetime',
            'billing_period_ends_at' => 'immutable_datetime',
            'runway_months' => 'float',
        ];
    }
}
