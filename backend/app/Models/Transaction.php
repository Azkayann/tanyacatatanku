<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model {
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'user_id',
        'account_id',
        'category_id',
        'type',
        'amount',
        'currency',
        'description',
        'occurred_at',
        'source',
        'external_id',
        'idempotency_key',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'occurred_at' => 'datetime',
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function account() {
        return $this->belongsTo(Account::class);
    }

    public function category() {
        return $this->belongsTo(Category::class);
    }
}
