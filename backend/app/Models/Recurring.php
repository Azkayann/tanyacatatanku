<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recurring extends Model {
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'account_id',
        'category_id',
        'name',
        'type',
        'amount',
        'currency',
        'frequency',
        'interval',
        'day_of_month',
        'start_date',
        'end_date',
        'next_run_at',
        'auto_post',
        'is_active',
        'problem_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'next_run_at' => 'date',
        'start_date' => 'date',
        'end_date' => 'date',
        'interval' => 'integer',
        'day_of_month' => 'integer',
        'auto_post' => 'boolean',
        'is_active' => 'boolean',
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

    /**
     * Hitung tanggal kejadian berikutnya (F-07).
     * @param array{frequency:string,interval:int,day_of_month:int|null} $r
     */
    public static function nextOccurrence(array $r, string $fromDate, bool $strictlyAfter = false): string
    {
        $from = \Carbon\Carbon::parse($fromDate)->startOfDay();
        $freq = $r['frequency'];
        $interval = max(1, (int) ($r['interval'] ?? 1));
        $dom = (int) ($r['day_of_month'] ?? 1);
        $dom = max(1, min(31, $dom));

        $candidate = clone $from;
        if ($freq === 'weekly') {
            $candidate = $from->copy()->addDays($interval * 7);
            return $candidate->format('Y-m-d');
        }

        if ($freq === 'monthly' || $freq === 'every_n_months') {
            $stepMonths = $freq === 'monthly' ? 1 : $interval;
            $candidate = $from->copy()->startOfDay();
            while (true) {
                $clamped = min($dom, $candidate->daysInMonth);
                $occ = (clone $candidate)->setDay($clamped)->startOfDay();
                if ($occ->lt($from) || ($strictlyAfter && $occ->lte($from))) {
                    $candidate->addMonths($stepMonths);
                    continue;
                }
                return $occ->format('Y-m-d');
            }
        }

        // yearly
        $clamped = min($dom, $from->daysInMonth);
        $occ = (clone $from)->setDay($clamped)->startOfDay();
        if ($occ->lt($from) || ($strictlyAfter && $occ->lte($from))) {
            $occ->addYear();
        }
        return $occ->format('Y-m-d');
    }
}
