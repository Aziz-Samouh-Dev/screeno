<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('charges', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->enum('category', ['loyer', 'salaires', 'energie', 'transport', 'taxes', 'assurance', 'telecom', 'autre']);
            $table->string('description');
            $table->decimal('amount', 12, 2);
            $table->date('date');
            $table->enum('recurrence', ['ponctuelle', 'mensuelle', 'trimestrielle', 'annuelle'])->default('ponctuelle');
            $table->string('payment_method')->nullable();
            $table->enum('status', ['paye', 'a_payer'])->default('a_payer');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('charges');
    }
};
