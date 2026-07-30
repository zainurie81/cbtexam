<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Overwrite default Inertia render with our controller
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/monitoring', [DashboardController::class, 'monitoring'])->name('dashboard.monitoring');
    Route::get('/dashboard/devices', [DashboardController::class, 'devices'])->name('dashboard.devices');
    Route::get('/dashboard/config', [DashboardController::class, 'config'])->name('dashboard.config');

    // Admin action endpoints
    Route::post('/api/web/devices/{device}/toggle-lock', [DashboardController::class, 'toggleDeviceLock']);
    Route::post('/api/web/sessions/{session}/kick', [DashboardController::class, 'kickSession']);
    Route::post('/api/web/config/update', [DashboardController::class, 'updateConfig'])->name('dashboard.config.update');
    Route::post('/api/web/policies/{policy}/update', [DashboardController::class, 'updatePolicy'])->name('dashboard.policy.update');
});

require __DIR__.'/settings.php';
