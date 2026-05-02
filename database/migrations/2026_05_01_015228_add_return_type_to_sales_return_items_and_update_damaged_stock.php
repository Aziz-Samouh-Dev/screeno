<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_return_items', function (Blueprint $table) {
            $table->enum('return_type', ['stock', 'damaged'])->default('stock')->after('quantity');
        });

        Schema::table('damaged_stock', function (Blueprint $table) {
            $table->unsignedBigInteger('client_transaction_id')->nullable()->change();
            $table->foreignId('sales_return_item_id')
                ->nullable()
                ->constrained('sales_return_items')
                ->nullOnDelete()
                ->after('client_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::table('damaged_stock', function (Blueprint $table) {
            $table->dropConstrainedForeignId('sales_return_item_id');
            $table->unsignedBigInteger('client_transaction_id')->nullable(false)->change();
        });

        Schema::table('sales_return_items', function (Blueprint $table) {
            $table->dropColumn('return_type');
        });
    }
};
