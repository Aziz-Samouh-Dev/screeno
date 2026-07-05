<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('charge_categories', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('nom', 100);
            $table->string('slug', 50)->unique();
            $table->string('color', 60)->default('text-slate-500');
            $table->string('bg_color', 60)->default('bg-slate-50 dark:bg-slate-800/40');
            $table->string('icon_name', 50)->default('more-horizontal');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('charge_categories');
    }
};
