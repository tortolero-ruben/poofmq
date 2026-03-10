<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FundingController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', fn () => Inertia::render('welcome', [
    'canRegister' => Features::enabled(Features::registration()),
    'donationUrl' => config('services.donations.donation_url'),
]))->name('home');

Route::inertia('start', 'start/index')->name('start.index');
Route::inertia('docs/quickstart', 'docs/quickstart')->name('docs.quickstart');
Route::get('funding', [FundingController::class, 'index'])->name('funding.index');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('funding/admin', [FundingController::class, 'admin'])
        ->middleware('can:viewAdminFunding')
        ->name('funding.admin');
});

require __DIR__.'/settings.php';
require __DIR__.'/api-keys.php';
require __DIR__.'/projects.php';
require __DIR__.'/developers.php';
