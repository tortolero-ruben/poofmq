<?php

use App\Jobs\ReconcileApiKeysToRedis;
use App\Jobs\SyncRailwayBillingSnapshot;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule API key reconciliation to run every 5 minutes
Schedule::job(new ReconcileApiKeysToRedis)
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();

Schedule::job(new SyncRailwayBillingSnapshot)
    ->hourly()
    ->withoutOverlapping()
    ->onOneServer();
