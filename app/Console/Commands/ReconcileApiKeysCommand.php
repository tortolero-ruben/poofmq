<?php

namespace App\Console\Commands;

use App\Jobs\ReconcileApiKeysToRedis;
use Illuminate\Console\Command;

class ReconcileApiKeysCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:reconcile-api-keys';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reconcile API keys from Postgres to Redis cache';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting API key reconciliation...');

        $job = new ReconcileApiKeysToRedis;
        $job->handle();

        $this->info('API key reconciliation completed.');

        return self::SUCCESS;
    }
}
