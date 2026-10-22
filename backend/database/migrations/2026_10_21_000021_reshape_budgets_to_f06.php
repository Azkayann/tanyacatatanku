<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Tabel budgets kosong → ubah bentuk menjadi spesifikasi F-06 tanpa risiko data.
        Schema::table('budgets', function (Blueprint $table) {
            $table->renameColumn('limit_amount', 'amount');
            $table->dropColumn(['name', 'period', 'period_start', 'period_end']);
        });

        Schema::table('budgets', function (Blueprint $table) {
            $table->char('starts_month', 7)->nullable()->after('category_id'); // YYYY-MM; null = berlanjut tiap bulan
            $table->smallInteger('warn_at_percent')->unsigned()->default(80)->after('starts_month');
            $table->boolean('aktif')->default(true)->after('warn_at_percent');

            // Satu budget per kategori per bulan mulai.
            $table->unique(['user_id', 'category_id', 'starts_month']);
        });
    }

    public function down(): void {
        Schema::table('budgets', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'category_id', 'starts_month']);
        });

        Schema::table('budgets', function (Blueprint $table) {
            $table->string('name');
            $table->string('period')->default('monthly');
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->dropColumn(['starts_month', 'warn_at_percent', 'aktif']);
            $table->renameColumn('amount', 'limit_amount');
        });
    }
};
