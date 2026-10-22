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
        'transfer_id',
        'recurring_rule_id',
        'type',
        'kind',
        'amount',
        'currency',
        'description',
        'image_path',
        'occurred_at',
        'source',
        'external_id',
        'idempotency_key',
    ];

    protected $appends = ['image_url', 'counts_in_report'];

    protected $casts = [
        'amount' => 'decimal:2',
        'occurred_at' => 'datetime',
    ];

    public function getImageUrlAttribute(): ?string {
        if (!$this->image_path) {
            return null;
        }
        $path = \Illuminate\Support\Facades\Storage::disk('public')->url($this->image_path);
        return url($path);
    }

    public function getCountsInReportAttribute(): bool {
        return ($this->kind ?? $this->type) !== 'adjustment';
    }

    public function getKindLabelAttribute(): ?string {
        return match ($this->kind ?? $this->type) {
            'adjustment' => 'Penyesuaian',
            'income' => 'Pemasukan',
            'expense' => 'Pengeluaran',
            default => null,
        };
    }

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function account() {
        return $this->belongsTo(Account::class);
    }

    public function category() {
        return $this->belongsTo(Category::class);
    }

    public function transfer() {
        return $this->belongsTo(Transfer::class, 'transfer_id');
    }
}
