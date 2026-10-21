<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\TransactionController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\SummaryController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\AuthController;

// Public routes
Route::prefix('v1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes
Route::prefix('v1')->middleware(['api.token'])->group(function () {
    Route::get('/me', [MeController::class, 'show']);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/summary', [SummaryController::class, 'show']);
    Route::get('/reports/export-pdf', [ReportController::class, 'exportPdf']);

    Route::apiResource('transactions', TransactionController::class);

    // API Token Management
    Route::get('/api-tokens', [\App\Http\Controllers\Api\V1\ApiTokenController::class, 'index']);
    Route::post('/api-tokens', [\App\Http\Controllers\Api\V1\ApiTokenController::class, 'store']);
    Route::delete('/api-tokens/{id}', [\App\Http\Controllers\Api\V1\ApiTokenController::class, 'destroy']);
});
