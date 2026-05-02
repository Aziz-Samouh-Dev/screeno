<?php

use App\Http\Controllers\Settings\CompanyProfileController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use App\Http\Controllers\Settings\UserManagementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');
});

// Admin-only routes
Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::get('settings/company', [CompanyProfileController::class, 'edit'])->name('company.edit');
    Route::put('settings/company', [CompanyProfileController::class, 'update'])->name('company.update');

    Route::get('settings/users', [UserManagementController::class, 'index'])->name('users.index');
    Route::post('settings/users', [UserManagementController::class, 'store'])->name('users.store');
    Route::put('settings/users/{user}', [UserManagementController::class, 'update'])->name('users.update');
    Route::delete('settings/users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');
});
