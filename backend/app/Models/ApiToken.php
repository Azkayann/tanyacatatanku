<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApiToken extends Model {
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'name',
        'token_hash',
        'token_encrypted',
        'abilities',
        'last_used_at',
        'expires_at',
    ];

    protected $casts = [
        'abilities' => 'array',
        'token_encrypted' => 'encrypted',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }
}
