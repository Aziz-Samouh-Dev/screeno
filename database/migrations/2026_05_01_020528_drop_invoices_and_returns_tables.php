<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop FK on damaged_stock that references sales_return_items
        if (Schema::hasColumn('damaged_stock', 'sales_return_item_id')) {
            Schema::table('damaged_stock', function (Blueprint $table) {
                $table->dropConstrainedForeignId('sales_return_item_id');
            });
        }

        Schema::dropIfExists('sales_return_items');
        Schema::dropIfExists('sales_returns');
        Schema::dropIfExists('payment_histories');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('sales_invoice_items');
        Schema::dropIfExists('sales_invoices');
        Schema::dropIfExists('purchase_invoice_items');
        Schema::dropIfExists('purchase_invoices');
    }

    public function down(): void
    {
        // Destructive migration — not reversible.
    }
};
