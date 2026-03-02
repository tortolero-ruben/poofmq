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
        Schema::create('donation_ledger_entries', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('provider', 64);
            $table->string('provider_event_id', 128);
            $table->string('event_type', 64);
            $table->integer('amount_cents');
            $table->string('currency', 3);
            $table->string('donor_name')->nullable();
            $table->string('donor_email')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('happened_at');
            $table->timestamps();

            $table->unique(['provider', 'provider_event_id']);
            $table->index('happened_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('donation_ledger_entries');
    }
};
