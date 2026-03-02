<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DonationLedgerEntry extends Model
{
    /** @use HasFactory<\Database\Factories\DonationLedgerEntryFactory> */
    use HasFactory, HasUlids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'provider',
        'provider_event_id',
        'event_type',
        'amount_cents',
        'currency',
        'donor_name',
        'donor_email',
        'metadata',
        'happened_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'happened_at' => 'immutable_datetime',
        ];
    }
}
