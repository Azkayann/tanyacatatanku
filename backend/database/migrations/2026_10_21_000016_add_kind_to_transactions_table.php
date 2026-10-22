<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('kind', 20)->nullable()->after('type');
        });

        // Backfill: kind = type untuk semua transaksi lama
        DB::table('transactions')->whereNull('kind')->update([
            'kind' => DB::raw('type'),
        ]);

        // Data fix: 3 transaksi "Penyesuaian saldo" (DANA/BRIMO/Cash) jadi adjustment.
        // Idempotent: hanya menyentuh income berdeskripsi penyesuaian.
        DB::table('transactions')
            ->where('kind', 'income')
            ->where('description', 'Penyesuaian saldo')
            ->update(['kind' => 'adjustment']);
    }

    public function down(): void {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('kind');
        });
    }
};
