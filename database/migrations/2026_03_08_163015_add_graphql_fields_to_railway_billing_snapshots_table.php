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
        Schema::table('railway_billing_snapshots', function (Blueprint $table) {
            $table->integer('current_spend_cents')->default(0)->after('month_to_date_spend_cents');
            $table->integer('estimated_spend_cents')->default(0)->after('current_spend_cents');
            $table->integer('credit_balance_cents')->default(0)->after('estimated_spend_cents');
            $table->integer('applied_credits_cents')->default(0)->after('credit_balance_cents');
            $table->integer('latest_invoice_total_cents')->nullable()->after('applied_credits_cents');
            $table->integer('funding_gap_cents')->default(0)->after('latest_invoice_total_cents');
            $table->timestamp('billing_period_starts_at')->nullable()->after('captured_at');
            $table->timestamp('billing_period_ends_at')->nullable()->after('billing_period_starts_at');
            $table->string('snapshot_source')->default('railway_graphql')->after('raw_payload');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('railway_billing_snapshots', function (Blueprint $table) {
            $table->dropColumn([
                'current_spend_cents',
                'estimated_spend_cents',
                'credit_balance_cents',
                'applied_credits_cents',
                'latest_invoice_total_cents',
                'funding_gap_cents',
                'billing_period_starts_at',
                'billing_period_ends_at',
                'snapshot_source',
            ]);
        });
    }
};
