<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\TransactionController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\SummaryController;
use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\BudgetController;
use App\Http\Controllers\Api\V1\RecurringController;
use App\Http\Controllers\Api\V1\TransferController;
use App\Http\Controllers\Api\V1\UserNotificationController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\StatsController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AdminUsersController;
use App\Http\Controllers\Api\V1\AdminDashboardController;
use App\Http\Controllers\Api\V1\AdminAuditLogsController;
use App\Http\Controllers\Api\V1\AdminPdfTemplatesController;
use App\Http\Controllers\Api\V1\AdminSettingsController;

// Public routes
Route::prefix('v1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes
Route::prefix('v1')->middleware(['api.token'])->group(function () {
    Route::get('/me', [MeController::class, 'show']);
    Route::put('/me', [MeController::class, 'update']);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::patch('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
    Route::get('/categories/{id}/merge-preview', [CategoryController::class, 'previewMerge']);
    Route::post('/categories/{id}/merge', [CategoryController::class, 'merge']);
    Route::get('/summary', [SummaryController::class, 'show']);
    Route::get('/reports/monthly', [ReportController::class, 'monthly']);
    Route::get('/reports/monthly/export', [ReportController::class, 'exportMonthly']);
    Route::get('/reports/export-pdf', [ReportController::class, 'exportPdf']);

    Route::get('/stats/trend', [StatsController::class, 'trend']);
    Route::get('/stats/by-category', [StatsController::class, 'byCategory']);
    Route::get('/stats/top-expenses', [StatsController::class, 'topExpenses']);

    Route::apiResource('transactions', TransactionController::class);
    Route::post('/transactions/{id}/image', [TransactionController::class, 'uploadImage']);
    Route::delete('/transactions/{id}/image', [TransactionController::class, 'deleteImage']);
    Route::get('/accounts', [AccountController::class, 'index']);
    Route::post('/accounts', [AccountController::class, 'store']);
    Route::put('/accounts/{id}', [AccountController::class, 'update']);
    Route::patch('/accounts/{id}', [AccountController::class, 'update']);

    Route::get('/budgets', [BudgetController::class, 'index']);
    Route::post('/budgets', [BudgetController::class, 'store']);
    Route::put('/budgets/{id}', [BudgetController::class, 'update']);
    Route::delete('/budgets/{id}', [BudgetController::class, 'destroy']);

    Route::get('/transfers', [TransferController::class, 'index']);
    Route::post('/transfers', [TransferController::class, 'store']);
    Route::get('/transfers/{id}', [TransferController::class, 'show']);
    Route::put('/transfers/{id}', [TransferController::class, 'update']);
    Route::patch('/transfers/{id}', [TransferController::class, 'update']);
    Route::delete('/transfers/{id}', [TransferController::class, 'destroy']);

    Route::get('/recurrings', [RecurringController::class, 'index']);
    Route::post('/recurrings', [RecurringController::class, 'store']);
    Route::put('/recurrings/{id}', [RecurringController::class, 'update']);
    Route::patch('/recurrings/{id}', [RecurringController::class, 'update']);
    Route::delete('/recurrings/{id}', [RecurringController::class, 'destroy']);
    Route::post('/recurrings/{id}/skip', [RecurringController::class, 'skip']);
    Route::post('/recurrings/{id}/run-now', [RecurringController::class, 'runNow']);

    Route::get('/notifications', [UserNotificationController::class, 'index']);
    Route::put('/notifications/read-all', [UserNotificationController::class, 'markAllRead']);
    Route::put('/notifications/{id}/read', [UserNotificationController::class, 'markRead']);
    Route::delete('/notifications/{id}', [UserNotificationController::class, 'destroy']);

    // API Token Management
    Route::get('/api-tokens', [\App\Http\Controllers\Api\V1\ApiTokenController::class, 'index']);
    Route::post('/api-tokens', [\App\Http\Controllers\Api\V1\ApiTokenController::class, 'store']);
    Route::delete('/api-tokens/{id}', [\App\Http\Controllers\Api\V1\ApiTokenController::class, 'destroy']);

    // Admin routes
    Route::prefix('admin')->group(function () {
        Route::get('/users', [AdminUsersController::class, 'index']);
        Route::get('/dashboard', [AdminDashboardController::class, 'getStats']);
        Route::get('/api-metrics', [AdminDashboardController::class, 'getApiMetrics']);
        Route::get('/system-health', [AdminDashboardController::class, 'getSystemHealth']);
        Route::get('/audit-logs', [AdminAuditLogsController::class, 'index']);
        Route::get('/pdf-templates', [AdminPdfTemplatesController::class, 'index']);
        Route::post('/pdf-templates', [AdminPdfTemplatesController::class, 'store']);
        Route::delete('/pdf-templates/{id}', [AdminPdfTemplatesController::class, 'destroy']);
        Route::get('/settings', [AdminSettingsController::class, 'index']);
        Route::put('/settings', [AdminSettingsController::class, 'update']);
    });
});
