<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        // Kategori sistem untuk biaya transfer (expense). Idempotent.
        $exists = DB::table('categories')
            ->where('name', 'Biaya transfer')
            ->where('is_system', true)
            ->exists();
        if ($exists) {
            return;
        }
        DB::table('categories')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => null,
            'name' => 'Biaya transfer',
            'type' => 'expense',
            'is_system' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void {
        DB::table('categories')
            ->where('name', 'Biaya transfer')
            ->where('is_system', true)
            ->delete();
    }
};
