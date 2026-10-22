<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('api_tokens', function (Blueprint $table) {
            // Menyimpan plaintext token terenkripsi agar bisa ditampilkan ulang oleh user.
            // Keamanan: hanya bisa didekripsi dengan APP_KEY server, bukan disimpan plaintext.
            $table->text('token_encrypted')->nullable()->after('token_hash');
        });
    }

    public function down(): void {
        Schema::table('api_tokens', function (Blueprint $table) {
            $table->dropColumn('token_encrypted');
        });
    }
};
