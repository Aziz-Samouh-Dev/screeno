<?php

use App\Http\Controllers\ClientController;
use App\Http\Controllers\ClientTransactionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\ProduitController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SupplierTransactionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {

    // PRODUITS
    Route::post('/produits/bulk-delete', [ProduitController::class, 'bulkDelete'])
        ->name('produits.bulk-delete');
    Route::resource('produits', ProduitController::class);

    // CLIENTS
    Route::get('/clients/{client}/ledger',     [ClientTransactionController::class, 'ledger'])->name('clients.ledger');
    Route::get('/clients/{client}/ledger/pdf', [ClientTransactionController::class, 'ledgerPdf'])->name('clients.ledger.pdf');
    Route::get('/clients/{client}/sell',       [ClientTransactionController::class, 'sell'])->name('clients.sell');
    Route::post('/clients/{client}/sell',      [ClientTransactionController::class, 'storeSell'])->name('clients.sell.store');
    Route::get('/clients/{client}/return',     [ClientTransactionController::class, 'returnForm'])->name('clients.return');
    Route::post('/clients/{client}/return',    [ClientTransactionController::class, 'storeReturn'])->name('clients.return.store');
    Route::get('/clients/{client}/payment',    [ClientTransactionController::class, 'paymentForm'])->name('clients.payment');
    Route::post('/clients/{client}/payment',   [ClientTransactionController::class, 'storePayment'])->name('clients.payment.store');

    Route::resource('clients', ClientController::class);
    Route::post('/clients/bulk-delete', [ClientController::class, 'bulkDelete'])
        ->name('clients.bulk-delete');
    Route::get('/clients/export/csv', [ClientController::class, 'exportCsv'])
        ->name('clients.export');

    // PAYMENTS & STOCK
    Route::get('/payments', [ClientTransactionController::class, 'paymentsList'])->name('payments.index');
    Route::get('/stock',    [ClientTransactionController::class, 'stockList'])->name('stock.index');

    // SUPPLIERS
    Route::get('/suppliers/{supplier}/purchase',  [SupplierTransactionController::class, 'purchaseForm'])->name('suppliers.purchase');
    Route::post('/suppliers/{supplier}/purchase', [SupplierTransactionController::class, 'storePurchase'])->name('suppliers.purchase.store');
    Route::get('/suppliers/{supplier}/return',    [SupplierTransactionController::class, 'returnForm'])->name('suppliers.return');
    Route::post('/suppliers/{supplier}/return',   [SupplierTransactionController::class, 'storeReturn'])->name('suppliers.return.store');
    Route::get('/suppliers/{supplier}/payment',   [SupplierTransactionController::class, 'paymentForm'])->name('suppliers.payment');
    Route::post('/suppliers/{supplier}/payment',  [SupplierTransactionController::class, 'storePayment'])->name('suppliers.payment.store');
    Route::get('/suppliers/{supplier}/ledger',    [SupplierTransactionController::class, 'ledger'])->name('suppliers.ledger');

    Route::resource('suppliers', SupplierController::class);
    Route::post('/suppliers/bulk-delete', [SupplierController::class, 'bulkDelete'])
        ->name('suppliers.bulk-delete');
    Route::get('/suppliers/export/csv', [SupplierController::class, 'exportCsv'])
        ->name('suppliers.export');

    Route::resource('/settings/payment_methods', PaymentMethodController::class);

});

require __DIR__.'/settings.php';
