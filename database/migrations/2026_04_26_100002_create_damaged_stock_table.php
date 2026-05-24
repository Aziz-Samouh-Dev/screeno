<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('damaged_stock', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->nullable()->constrained('produits')->nullOnDelete();
            $table->string('product_name');
            $table->integer('quantity');
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('client_transaction_id')->nullable()->constrained('client_transactions')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('damaged_stock');
    }
};
