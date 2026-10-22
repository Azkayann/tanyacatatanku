<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    private const NEW_SYSTEM_CATEGORIES = [
        ['name' => 'Tagihan', 'type' => 'expense'],
        ['name' => 'Belanja', 'type' => 'expense'],
        ['name' => 'Hiburan', 'type' => 'expense'],
        ['name' => 'Kesehatan', 'type' => 'expense'],
        ['name' => 'Lainnya', 'type' => 'expense'],
    ];

    public function up(): void {
        foreach (self::NEW_SYSTEM_CATEGORIES as $cat) {
            // Idempotent: skip jika system category dengan nama sama sudah ada
            $exists = DB::table('categories')
                ->where('name', $cat['name'])
                ->where('is_system', true)
                ->exists();
            if ($exists) {
                continue;
            }
            DB::table('categories')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'user_id' => null,
                'name' => $cat['name'],
                'type' => $cat['type'],
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void {
        DB::table('categories')
            ->whereIn('name', array_column(self::NEW_SYSTEM_CATEGORIES, 'name'))
            ->where('is_system', true)
            ->delete();
    }
};
