<?php

use App\Http\Controllers\ChargeCategoryController;
use App\Http\Controllers\ChargeController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ClientTransactionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\ProduitController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SupplierTransactionController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Serve public-disk files through PHP (works with php artisan serve + Windows junctions)
Route::get('/file/{path}', function (string $path) {
    abort_if(str_contains($path, '..'), 400);
    $disk = Storage::disk('public');
    abort_if(!$disk->exists($path), 404);
    return response($disk->get($path), 200, [
        'Content-Type'  => $disk->mimeType($path),
        'Cache-Control' => 'public, max-age=86400, immutable',
    ]);
})->where('path', '.*')->name('file.serve');

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
    Route::get('/suppliers/{supplier}/ledger',     [SupplierTransactionController::class, 'ledger'])->name('suppliers.ledger');
    Route::get('/suppliers/{supplier}/ledger/pdf', [SupplierTransactionController::class, 'ledgerPdf'])->name('suppliers.ledger.pdf');

    Route::resource('suppliers', SupplierController::class);
    Route::post('/suppliers/bulk-delete', [SupplierController::class, 'bulkDelete'])
        ->name('suppliers.bulk-delete');
    Route::get('/suppliers/export/csv', [SupplierController::class, 'exportCsv'])
        ->name('suppliers.export');

    Route::resource('/settings/payment_methods', PaymentMethodController::class);

    // GESTION — admin uniquement
    Route::middleware('admin')->group(function () {

        // Finances
        Route::get('/finances',          [FinanceController::class, 'index'])->name('finances.index');
        Route::post('/finances/capital', [FinanceController::class, 'updateCapital'])->name('finances.capital');

        // Catégories de charges
        Route::get('/parametres/categories',                    [ChargeCategoryController::class, 'index'])->name('charge-categories.index');
        Route::post('/parametres/categories',                   [ChargeCategoryController::class, 'store'])->name('charge-categories.store');
        Route::put('/parametres/categories/{chargeCategory}',   [ChargeCategoryController::class, 'update'])->name('charge-categories.update');
        Route::delete('/parametres/categories/{chargeCategory}',[ChargeCategoryController::class, 'destroy'])->name('charge-categories.destroy');

        // Charges
        Route::get('/charges/export/pdf', [ChargeController::class, 'exportPdf'])->name('charges.export.pdf');
        Route::get('/charges',            [ChargeController::class, 'index'])->name('charges.index');
        Route::post('/charges',           [ChargeController::class, 'store'])->name('charges.store');
        Route::put('/charges/{charge}',   [ChargeController::class, 'update'])->name('charges.update');
        Route::delete('/charges/{charge}',[ChargeController::class, 'destroy'])->name('charges.destroy');

        // Employés
        Route::post('/employees/pay-all',          [EmployeeController::class, 'payAll'])->name('employees.pay-all');
        Route::post('/employees/{employee}/pay',   [EmployeeController::class, 'pay'])->name('employees.pay');
        Route::get('/employees/create',            [EmployeeController::class, 'create'])->name('employees.create');
        Route::get('/employees/{employee}/edit',   [EmployeeController::class, 'edit'])->name('employees.edit');
        Route::get('/employees',                   [EmployeeController::class, 'index'])->name('employees.index');
        Route::post('/employees',                  [EmployeeController::class, 'store'])->name('employees.store');
        Route::put('/employees/{employee}',        [EmployeeController::class, 'update'])->name('employees.update');
        Route::delete('/employees/{employee}',     [EmployeeController::class, 'destroy'])->name('employees.destroy');

    });

});

require __DIR__.'/settings.php';
