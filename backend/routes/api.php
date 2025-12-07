<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

// Simple test route
Route::get('/ping', function () {
    return response()->json(['message' => 'api ping ok']);
});

// Auth routes (public)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    Route::get('/wallet',        [TransactionController::class, 'wallet']);
    Route::post('/deposit',      [TransactionController::class, 'deposit']);
    Route::post('/withdraw',     [TransactionController::class, 'withdraw']);
    Route::post('/transfer',     [TransactionController::class, 'transfer']);
    Route::get('/transactions',  [TransactionController::class, 'myTransactions']);


    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/change-password', [ProfileController::class, 'changePassword']);
    
    // admin-only
    Route::get(
        '/admin/transactions',
        [TransactionController::class, 'adminTransactions']
    )->middleware('admin');

    Route::get(
        '/admin/users',
        [AdminUserController::class, 'index']
    )->middleware('admin');
});


