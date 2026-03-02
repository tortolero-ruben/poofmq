<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActiveMonthBoost extends Model
{
    /** @use HasFactory<\Database\Factories\ActiveMonthBoostFactory> */
    use HasFactory, HasUlids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'multiplier',
        'starts_at',
        'ends_at',
        'activated_by',
        'deactivated_at',
        'notes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'immutable_datetime',
            'ends_at' => 'immutable_datetime',
            'deactivated_at' => 'immutable_datetime',
        ];
    }

    /**
     * Determine whether this boost record is active right now.
     */
    public function isActive(): bool
    {
        $now = now();

        return $this->deactivated_at === null
            && $this->starts_at->lessThanOrEqualTo($now)
            && $this->ends_at->greaterThanOrEqualTo($now);
    }
}
