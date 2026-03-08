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
            $table->integer('poofmq_attributed_current_spend_cents')->default(0)->after('estimated_spend_cents');
            $table->integer('poofmq_attributed_estimated_spend_cents')->default(0)->after('poofmq_attributed_current_spend_cents');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('railway_billing_snapshots', function (Blueprint $table) {
            $table->dropColumn([
                'poofmq_attributed_current_spend_cents',
                'poofmq_attributed_estimated_spend_cents',
            ]);
        });
    }
};
