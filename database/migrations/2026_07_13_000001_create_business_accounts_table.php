<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('Compte principal');
            $table->decimal('initial_capital', 15, 2)->default(0);
            $table->string('currency', 3)->default('MAD');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_accounts');
    }
};
