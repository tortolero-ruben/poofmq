<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('railway_billing_snapshots', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->integer('balance_cents');
            $table->integer('month_to_date_spend_cents');
            $table->decimal('runway_months', 8, 2);
            $table->json('raw_payload')->nullable();
            $table->timestamp('captured_at');
            $table->timestamps();

            $table->index('captured_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('railway_billing_snapshots');
    }
};
