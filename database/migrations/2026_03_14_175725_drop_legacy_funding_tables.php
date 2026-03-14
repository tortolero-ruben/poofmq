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
        Schema::dropIfExists('donation_ledger_entries');
        Schema::dropIfExists('railway_billing_snapshots');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
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

        Schema::create('railway_billing_snapshots', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->integer('balance_cents');
            $table->integer('month_to_date_spend_cents');
            $table->integer('current_spend_cents')->default(0);
            $table->integer('estimated_spend_cents')->default(0);
            $table->integer('poofmq_attributed_current_spend_cents')->default(0);
            $table->integer('poofmq_attributed_estimated_spend_cents')->default(0);
            $table->integer('credit_balance_cents')->default(0);
            $table->integer('applied_credits_cents')->default(0);
            $table->integer('latest_invoice_total_cents')->nullable();
            $table->integer('funding_gap_cents')->default(0);
            $table->decimal('runway_months', 8, 2);
            $table->json('raw_payload')->nullable();
            $table->string('snapshot_source')->default('railway_graphql');
            $table->timestamp('captured_at');
            $table->timestamp('billing_period_starts_at')->nullable();
            $table->timestamp('billing_period_ends_at')->nullable();
            $table->timestamps();

            $table->index('captured_at');
        });
    }
};
