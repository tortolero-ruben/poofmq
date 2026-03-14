<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', fn () => Inertia::render('welcome', [
    'canRegister' => Features::enabled(Features::registration()),
    'donationUrl' => config('services.donations.donation_url'),
]))->name('home');

Route::inertia('start', 'start/index')->name('start.index');
Route::inertia('docs/quickstart', 'docs/quickstart')->name('docs.quickstart');
Route::redirect('funding', '/dashboard')->name('funding.index');
Route::redirect('funding/admin', '/dashboard')->name('funding.admin');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/api-keys.php';
require __DIR__.'/projects.php';
require __DIR__.'/developers.php';
