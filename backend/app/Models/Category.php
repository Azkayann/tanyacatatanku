<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model {
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'name',
        'type',
        'is_system',
    ];

    protected $casts = [
        'is_system' => 'boolean',
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function transactions() {
        return $this->hasMany(Transaction::class);
    }
}
