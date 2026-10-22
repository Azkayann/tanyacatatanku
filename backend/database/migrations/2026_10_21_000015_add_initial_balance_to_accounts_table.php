<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('accounts', function (Blueprint $table) {
            $table->decimal('initial_balance', 15, 2)->default(0)->after('balance');
        });
    }

    public function down(): void {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn('initial_balance');
        });
    }
};
