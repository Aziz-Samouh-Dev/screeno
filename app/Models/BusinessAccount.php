<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class BusinessAccount extends Model
{
    protected $fillable = ['name', 'initial_capital', 'currency'];

    protected $casts = [
        'initial_capital' => 'decimal:2',
    ];

    /** Always use row id=1 as the single business account. */
    public static function main(): static
    {
        return static::firstOrCreate(
            ['id' => 1],
            ['name' => 'Compte principal', 'initial_capital' => 0, 'currency' => 'MAD']
        );
    }

    /**
     * Compute the current balance from all recorded transactions.
     *
     * Balance = initial_capital
     *         + net sales (invoices issued − returns)
     *         − net purchases (invoices received − supplier refunds)
     *         − charges paid
     *         − employee salaries paid
     */
    public function computeBalance(): float
    {
        $capital = (float) $this->initial_capital;

        $salesNet = (float) ClientTransaction::where('type', 'F')->sum('total_price')
                  - (float) ClientTransaction::where('type', 'R')->sum('total_price');

        $purchasesNet = (float) SupplierTransaction::where('type', 'F')->sum('total_price')
                      - (float) SupplierTransaction::where('type', 'R')
                                    ->where('return_type', 'refund')->sum('total_price');

        $expenses = (float) Charge::sum('amount')
                  + (float) EmployeePayment::sum('amount');

        return round($capital + $salesNet - $purchasesNet - $expenses, 2);
    }
}
