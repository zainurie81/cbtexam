<?php

use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\ConfigApiController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\ExamApiController;
use App\Http\Controllers\Api\SessionApiController;
use Illuminate\Support\Facades\Route;

// Auth Route
Route::post('/login', [AuthApiController::class, 'login']);

// Config & Update Routes
Route::get('/config', [ConfigApiController::class, 'show']);
Route::post('/config/check-update', [ConfigApiController::class, 'checkUpdate']);
Route::get('/config/status', [ConfigApiController::class, 'checkStatus']);

// Device Routes
Route::post('/device/register', [DeviceController::class, 'register']);
Route::get('/device/{deviceId}', [DeviceController::class, 'show']);

// Exam Routes
Route::get('/exams', [ExamApiController::class, 'index']);
Route::post('/exams/join', [ExamApiController::class, 'join']);

// Session Routes (requires authentication via Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/session/start', [SessionApiController::class, 'start']);
    Route::post('/session/{session}/heartbeat', [SessionApiController::class, 'heartbeat']);
    Route::post('/session/{session}/log', [SessionApiController::class, 'log']);
    Route::post('/session/{session}/violation', [SessionApiController::class, 'violation']);
    Route::post('/session/{session}/submit', [SessionApiController::class, 'submit']);
});
