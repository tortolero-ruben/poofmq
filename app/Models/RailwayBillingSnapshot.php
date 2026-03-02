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
        'runway_months',
        'raw_payload',
        'captured_at',
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
            'runway_months' => 'float',
        ];
    }
}
