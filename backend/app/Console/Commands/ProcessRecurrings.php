<?php

namespace App\Console\Commands;

use App\Http\Controllers\Api\V1\RecurringController;
use App\Models\Recurring;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ProcessRecurrings extends Command
{
    protected $signature = 'recurring:process';

    protected $description = 'Proses transaksi berulang yang jatuh tempo (F-07).';

    public function handle(): int
    {
        $rules = Recurring::where('is_active', true)
            ->whereNotNull('next_run_at')
            ->where('next_run_at', '<=', now()->toDateTimeString())
            ->get();

        $count = 0;
        foreach ($rules as $rule) {
            if ($rule->end_date && $rule->next_run_at->gt($rule->end_date)) {
                $rule->update(['is_active' => false, 'problem_reason' => 'Mencapai tanggal akhir aturan']);
                continue;
            }

            DB::transaction(function () use ($rule, &$count) {
                RecurringController::postDue($rule);
                $rule->refresh();
                $rule->update([
                    'next_run_at' => Recurring::nextOccurrence([
                        'frequency' => $rule->frequency,
                        'interval' => $rule->interval,
                        'day_of_month' => $rule->day_of_month,
                    ], $rule->next_run_at->toDateString(), true),
                ]);
                $count++;
            });

            if ($rule->end_date && $rule->next_run_at->gt($rule->end_date)) {
                $rule->update(['is_active' => false, 'problem_reason' => 'Mencapai tanggal akhir aturan']);
            }
        }

        $this->info("Processed {$count} recurring rule(s).");

        return self::SUCCESS;
    }
}
