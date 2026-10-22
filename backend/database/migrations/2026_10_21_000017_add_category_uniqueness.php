<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        // 1. Kategori bawaan "Lainnya" untuk tipe income (expense sudah ada dari seed sebelumnya).
        foreach (['income', 'expense'] as $type) {
            $exists = DB::table('categories')
                ->where('name', 'Lainnya')
                ->where('is_system', true)
                ->where('type', $type)
                ->exists();
            if ($exists) {
                continue;
            }
            DB::table('categories')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'user_id' => null,
                'name' => 'Lainnya',
                'type' => $type,
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Pertahanan terakhir level DB: unik per (user_id, type, nama lowercase/trim).
        // (MySQL mengizinkan banyak NULL user_id, jadi kategori sistem tidak saling bentrok di index.)
        DB::statement('ALTER TABLE categories '
            . 'ADD COLUMN name_key VARCHAR(60) GENERATED ALWAYS AS (LOWER(TRIM(name))) STORED');
        DB::statement('CREATE UNIQUE INDEX categories_user_type_name_key '
            . 'ON categories (user_id, type, name_key)');

        // 3. Pindahkan transaksi pemasukan/pengeluaran lama tanpa kategori ke "Lainnya" per tipe.
        foreach (['income' => 'income', 'expense' => 'expense'] as $kind => $type) {
            $lainnya = DB::table('categories')
                ->where('name', 'Lainnya')
                ->where('is_system', true)
                ->where('type', $type)
                ->value('id');
            if (!$lainnya) {
                continue;
            }
            DB::table('transactions')
                ->whereNull('category_id')
                ->where('kind', $kind)
                ->update(['category_id' => $lainnya]);
        }
    }

    public function down(): void {
        DB::statement('DROP INDEX categories_user_type_name_key ON categories');
        DB::statement('ALTER TABLE categories DROP COLUMN name_key');
        // Kategori Lainnya income tidak dihapus agar aman; down() terbatas pada schema uniq.
    }
};
