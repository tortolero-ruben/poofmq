<?php

use App\Http\Controllers\Api\DeveloperKeyController;
use App\Http\Controllers\Api\SandboxQueueController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/instant/queues', [SandboxQueueController::class, 'store'])
    ->middleware('throttle:60,1')
    ->name('api.instant.queues.store');

Route::post('/developer-keys', [DeveloperKeyController::class, 'store'])
    ->middleware('throttle:12,1')
    ->name('api.developer-keys.store');

Route::post('/donations/webhooks', fn () => response()->noContent())
    ->middleware('throttle:60,1')
    ->name('api.donations.webhooks.store');
