<?php

namespace App\Console\Commands;

use App\Models\ActiveMonthBoost;
use Illuminate\Console\Command;

class ToggleActiveMonthBoostCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:active-month-boost
                            {state : enable|disable}
                            {--hours=720 : Duration in hours when enabling}
                            {--multiplier= : Override multiplier value}
                            {--notes= : Optional operator notes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Enable or disable Active Month Boost limit overrides.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $state = strtolower((string) $this->argument('state'));

        if ($state === 'enable') {
            $hours = max(1, (int) $this->option('hours'));
            $multiplier = (int) ($this->option('multiplier') ?? config('poofmq_capacity.active_month_boost_multiplier', 2));
            $multiplier = max(1, $multiplier);

            $boost = ActiveMonthBoost::query()->create([
                'multiplier' => $multiplier,
                'starts_at' => now(),
                'ends_at' => now()->addHours($hours),
                'notes' => $this->option('notes'),
            ]);

            $this->info(sprintf(
                'Active Month Boost enabled. id=%s multiplier=%d expires_at=%s',
                $boost->id,
                $boost->multiplier,
                $boost->ends_at->toIso8601String(),
            ));

            return self::SUCCESS;
        }

        if ($state === 'disable') {
            $updated = ActiveMonthBoost::query()
                ->whereNull('deactivated_at')
                ->where('starts_at', '<=', now())
                ->where('ends_at', '>=', now())
                ->update([
                    'deactivated_at' => now(),
                    'ends_at' => now(),
                ]);

            $this->info("Active Month Boost disabled for {$updated} active record(s).");

            return self::SUCCESS;
        }

        $this->error('Invalid state provided. Use enable or disable.');

        return self::INVALID;
    }
}
