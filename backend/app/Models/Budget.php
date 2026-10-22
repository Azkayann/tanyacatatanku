<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Budget extends Model {
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'category_id',
        'amount',
        'starts_month',
        'warn_at_percent',
        'aktif',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'warn_at_percent' => 'integer',
        'aktif' => 'boolean',
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function category() {
        return $this->belongsTo(Category::class);
    }
}
