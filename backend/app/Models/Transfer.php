<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transfer extends Model {
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'user_id',
        'from_account_id',
        'to_account_id',
        'amount',
        'fee',
        'fee_category_id',
        'description',
        'occurred_at',
        'idempotency_key',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fee' => 'decimal:2',
        'occurred_at' => 'datetime',
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function fromAccount() {
        return $this->belongsTo(Account::class, 'from_account_id');
    }

    public function toAccount() {
        return $this->belongsTo(Account::class, 'to_account_id');
    }

    public function feeCategory() {
        return $this->belongsTo(Category::class, 'fee_category_id');
    }

    public function feeTransaction() {
        return $this->hasOne(Transaction::class, 'transfer_id');
    }
}
