<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model {
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'actor_name',
        'action',
        'object_type',
        'object_id',
        'result',
        'ip_address',
    ];

    public static function log(
        ?User $user,
        string $action,
        ?string $objectType = null,
        ?string $objectId = null,
        string $result = 'success',
        ?string $ip = null
    ): void {
        self::create([
            'user_id' => $user?->id,
            'actor_name' => $user?->name,
            'action' => $action,
            'object_type' => $objectType,
            'object_id' => $objectId,
            'result' => $result,
            'ip_address' => $ip,
        ]);
    }

    public function user() {
        return $this->belongsTo(User::class);
    }
}
