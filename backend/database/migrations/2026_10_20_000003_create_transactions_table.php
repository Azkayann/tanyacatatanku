<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('account_id')->constrained('accounts')->onDelete('cascade');
            $table->foreignUuid('category_id')->nullable()->constrained('categories')->onDelete('set null');
            $table->enum('type', ['income', 'expense', 'transfer']);
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('IDR');
            $table->text('description')->nullable();
            $table->timestamp('occurred_at');
            $table->string('source')->default('manual'); // manual, ai_agent, import
            $table->string('external_id')->nullable();
            $table->string('idempotency_key')->nullable()->unique();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'occurred_at']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('transactions');
    }
};
