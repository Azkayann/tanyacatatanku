<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('from_account_id')->constrained('accounts')->onDelete('cascade');
            $table->foreignUuid('to_account_id')->constrained('accounts')->onDelete('cascade');
            $table->decimal('amount', 15, 2); // selalau positif (>0)
            $table->decimal('fee', 15, 2)->default(0);
            $table->foreignUuid('fee_category_id')->nullable()->constrained('categories')->onDelete('set null');
            $table->text('description')->nullable();
            $table->timestamp('occurred_at');
            $table->string('idempotency_key')->nullable()->unique();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['user_id', 'occurred_at']);
            $table->index(['user_id', 'from_account_id']);
            $table->index(['user_id', 'to_account_id']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('transfers');
    }
};
