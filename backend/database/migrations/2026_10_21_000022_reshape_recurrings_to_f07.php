<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Tabel recurrings kosong → ubah bentuk menjadi spesifikasi F-07.
        Schema::table('recurrings', function (Blueprint $table) {
            $table->enum('type', ['income', 'expense', 'adjustment'])->default('expense')->after('name');
            $table->unsignedSmallInteger('interval')->default(1)->after('frequency');
            $table->unsignedSmallInteger('day_of_month')->nullable()->after('interval');
            $table->date('start_date')->nullable()->after('day_of_month');
            $table->date('end_date')->nullable()->after('start_date');
            $table->boolean('auto_post')->default(true)->after('end_date');
            $table->string('problem_reason')->nullable()->after('is_active');
        });

        // Perluas frekuensi MySQL enum: weekly, monthly, every_n_months, yearly.
        Schema::table('recurrings', function (Blueprint $table) {
            $table->enum('frequency', ['weekly', 'monthly', 'every_n_months', 'yearly'])->default('monthly')->change();
        });
    }

    public function down(): void {
        Schema::table('recurrings', function (Blueprint $table) {
            $table->enum('frequency', ['weekly', 'monthly'])->default('monthly')->change();
        });
        Schema::table('recurrings', function (Blueprint $table) {
            $table->dropColumn(['type', 'interval', 'day_of_month', 'start_date', 'end_date', 'auto_post', 'problem_reason']);
        });
    }
};
