<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        // Keputusan user: kategori lama per-user yang nyaris sama dengan kategori
        // sistem (Gaji/Makanan/Transportasi) dikunci jadi is_system=true sehingga
        // tidak bisa diubah/dihapus/digabung dari dashboard. Idempotent.
        DB::table('categories')
            ->whereIn('name', ['Gaji', 'Makanan', 'Transportasi'])
            ->whereNotNull('user_id')
            ->where('is_system', false)
            ->update(['is_system' => true]);
    }

    public function down(): void {
        // Tidak ada undo yang aman: status kata kunci tidak bisa dipulihkan tanpa
        // tahu mana yang asli user. Biarkan kosong.
    }
};
