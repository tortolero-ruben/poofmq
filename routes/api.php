<?php

use App\Http\Controllers\Api\DonationWebhookController;
use App\Http\Controllers\Api\SandboxQueueController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/sandbox/queues', [SandboxQueueController::class, 'store'])
    ->middleware('throttle:60,1')
    ->name('api.sandbox.queues.store');

Route::post('/donations/webhooks', [DonationWebhookController::class, 'store'])
    ->middleware('throttle:60,1')
    ->name('api.donations.webhooks.store');
