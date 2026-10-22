<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Tautan transfer ke transaksi biayanya (fee), dan tautan aturan berulang ke
        // transaksi hasil pengulangan (F-07).
        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignUuid('transfer_id')->nullable()->after('category_id')
                ->constrained('transfers')->onDelete('cascade');
            $table->foreignUuid('recurring_rule_id')->nullable()->after('transfer_id')
                ->constrained('recurrings')->onDelete('set null');
        });
    }

    public function down(): void {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('transfer_id');
            $table->dropConstrainedForeignId('recurring_rule_id');
        });
    }
};
