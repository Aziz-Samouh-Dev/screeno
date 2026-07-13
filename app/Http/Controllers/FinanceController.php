<?php

namespace App\Http\Controllers;

use App\Models\BusinessAccount;
use App\Models\Charge;
use App\Models\ClientTransaction;
use App\Models\DamagedStock;
use App\Models\EmployeePayment;
use App\Models\SupplierTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FinanceController extends Controller
{
    /* ─────────────────────────────────────────────────────
     |  Dashboard
     ───────────────────────────────────────────────────── */
    public function index(Request $request)
    {
        $now   = now();
        $month = $request->filled('month') ? (int) $request->month : (int) $now->month;
        $year  = $request->filled('year')  ? (int) $request->year  : (int) $now->year;

        /* ── Virtual Account ── */
        $account = BusinessAccount::main();
        $balance = $account->computeBalance();

        /* ── ALL-TIME GLOBAL KPIs ── */

        // Sales
        $totalSalesRevenue = (float) ClientTransaction::where('type', 'F')->sum('total_price');
        $totalSalesReturns = (float) ClientTransaction::where('type', 'R')->sum('total_price');
        $netSales          = $totalSalesRevenue - $totalSalesReturns;

        // Purchases
        $totalPurchases       = (float) SupplierTransaction::where('type', 'F')->sum('total_price');
        $totalSupplierRefunds = (float) SupplierTransaction::where('type', 'R')
                                    ->where('return_type', 'refund')->sum('total_price');
        $netPurchases = $totalPurchases - $totalSupplierRefunds;

        // COGS — cost of goods actually sold (quantity × purchase price at time of sale)
        $cogs = (float) DB::table('client_transactions as ct')
            ->join('produits as p', 'ct.product_id', '=', 'p.id')
            ->where('ct.type', 'F')
            ->sum(DB::raw('ct.quantity * p.purchase_price'));

        $cogsReturned = (float) DB::table('client_transactions as ct')
            ->join('produits as p', 'ct.product_id', '=', 'p.id')
            ->where('ct.type', 'R')
            ->sum(DB::raw('ct.quantity * p.purchase_price'));

        $netCogs     = $cogs - $cogsReturned;
        $grossProfit = $netSales - $netCogs;
        $grossMarginPct = $netSales > 0 ? round(($grossProfit / $netSales) * 100, 1) : 0.0;

        // Operating expenses (charges + salaries)
        $totalCharges   = (float) Charge::sum('amount');
        $totalSalaries  = (float) EmployeePayment::sum('amount');
        $totalExpenses  = $totalCharges + $totalSalaries;

        // Product losses — value of damaged stock still not returned to any supplier
        $totalLossesValue = (float) DB::table('damaged_stock as ds')
            ->join('produits as p', 'ds.product_id', '=', 'p.id')
            ->sum(DB::raw('ds.quantity * p.purchase_price'));

        // Net Profit
        $netProfit = $grossProfit - $totalExpenses - $totalLossesValue;
        $netMarginPct = $netSales > 0 ? round(($netProfit / $netSales) * 100, 1) : 0.0;

        /* ── MONTHLY KPIs (for flux detail panel) ── */

        $caBrut = (float) ClientTransaction::where('type', 'F')
            ->whereMonth('created_at', $month)->whereYear('created_at', $year)->sum('total_price');
        $retoursClients = (float) ClientTransaction::where('type', 'R')
            ->whereMonth('created_at', $month)->whereYear('created_at', $year)->sum('total_price');
        $encaissements = (float) ClientTransaction::where('type', 'P')
            ->whereMonth('created_at', $month)->whereYear('created_at', $year)->sum('total_price');
        $retoursFourRemb = (float) SupplierTransaction::where('type', 'R')
            ->where('return_type', 'refund')
            ->whereMonth('created_at', $month)->whereYear('created_at', $year)->sum('total_price');

        $achatsBruts = (float) SupplierTransaction::where('type', 'F')
            ->whereMonth('created_at', $month)->whereYear('created_at', $year)->sum('total_price');
        $chargesMonth  = (float) Charge::whereMonth('date', $month)->whereYear('date', $year)->sum('amount');
        $salairesMonth = (float) EmployeePayment::where('month', $month)->where('year', $year)->sum('amount');

        $caNet        = $caBrut - $retoursClients;
        $achatsNets   = max(0, $achatsBruts - $retoursFourRemb);
        $totalSorties = $achatsNets + $chargesMonth + $salairesMonth;
        $benefice     = $caNet - $totalSorties;
        $marge        = $caBrut > 0 ? round(($benefice / $caBrut) * 100, 1) : 0.0;

        /* ── MONTHLY TREND — last 6 months ── */
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $d = $now->copy()->subMonths($i);
            $m = (int) $d->month;
            $y = (int) $d->year;

            $rev = (float) ClientTransaction::where('type', 'F')
                ->whereMonth('created_at', $m)->whereYear('created_at', $y)->sum('total_price');
            $rev -= (float) ClientTransaction::where('type', 'R')
                ->whereMonth('created_at', $m)->whereYear('created_at', $y)->sum('total_price');

            $exp  = (float) SupplierTransaction::where('type', 'F')
                ->whereMonth('created_at', $m)->whereYear('created_at', $y)->sum('total_price');
            $exp -= (float) SupplierTransaction::where('type', 'R')->where('return_type', 'refund')
                ->whereMonth('created_at', $m)->whereYear('created_at', $y)->sum('total_price');
            $exp += (float) Charge::whereMonth('date', $m)->whereYear('date', $y)->sum('amount');
            $exp += (float) EmployeePayment::where('month', $m)->where('year', $y)->sum('amount');

            // Monthly gross profit
            $mRev  = (float) ClientTransaction::where('type', 'F')
                ->whereMonth('created_at', $m)->whereYear('created_at', $y)->sum('total_price');
            $mCogs = (float) DB::table('client_transactions as ct')
                ->join('produits as p', 'ct.product_id', '=', 'p.id')
                ->where('ct.type', 'F')
                ->whereMonth('ct.created_at', $m)->whereYear('ct.created_at', $y)
                ->sum(DB::raw('ct.quantity * p.purchase_price'));

            $monthlyTrend[] = [
                'label'        => ucfirst($d->locale('fr')->isoFormat('MMM')),
                'revenue'      => round(max(0, $rev), 2),
                'charges'      => round(max(0, $exp), 2),
                'gross_profit' => round(max(0, $mRev - $mCogs), 2),
            ];
        }

        /* ── RÉPARTITION DES SORTIES (current month) ── */
        $repartition = [];
        if ($achatsNets > 0) {
            $repartition[] = ['key' => 'achats', 'label' => 'Achats marchandises', 'amount' => round($achatsNets, 2), 'color' => '#3b82f6'];
        }
        if ($salairesMonth > 0) {
            $repartition[] = ['key' => 'salaires_emp', 'label' => 'Salaires employés', 'amount' => round($salairesMonth, 2), 'color' => '#8b5cf6'];
        }

        $byCategory = Charge::whereMonth('date', $month)->whereYear('date', $year)
            ->leftJoin('charge_categories', 'charges.category', '=', 'charge_categories.slug')
            ->selectRaw('COALESCE(charge_categories.nom, charges.category) as label, charges.category as cat_key, SUM(charges.amount) as total')
            ->groupBy('charges.category', 'charge_categories.nom')
            ->get();

        $colors = ['#f59e0b','#f97316','#ef4444','#10b981','#06b6d4','#6366f1','#a78bfa','#94a3b8','#ec4899','#14b8a6'];
        $ci = 0;
        foreach ($byCategory as $cat) {
            $repartition[] = [
                'key'    => $cat->cat_key,
                'label'  => $cat->label,
                'amount' => round((float) $cat->total, 2),
                'color'  => $colors[$ci++ % count($colors)],
            ];
        }
        usort($repartition, fn ($a, $b) => $b['amount'] <=> $a['amount']);

        /* ── SOLDES CLIENTS / FOURNISSEURS (all-time receivables/payables) ── */
        $soldeClients = (float) ClientTransaction::whereRaw("type='F'")->sum('total_price')
            - (float) ClientTransaction::whereRaw("type='R'")->sum('total_price')
            - (float) ClientTransaction::whereRaw("type='P'")->sum('total_price');

        $soldeFournisseurs = (float) SupplierTransaction::whereRaw("type='F'")->sum('total_price')
            - (float) SupplierTransaction::where('type', 'R')->where('return_type', 'refund')->sum('total_price')
            - (float) SupplierTransaction::whereRaw("type='P'")->sum('total_price');

        $selectedDate = \Carbon\Carbon::createFromDate($year, $month, 1);

        return Inertia::render('finances/Index', [
            // Virtual account
            'account' => [
                'name'            => $account->name,
                'initial_capital' => round((float) $account->initial_capital, 2),
                'balance'         => $balance,
                'currency'        => $account->currency,
            ],

            // All-time global KPIs
            'global' => [
                'total_sales'        => round($netSales, 2),
                'total_purchases'    => round($netPurchases, 2),
                'cogs'               => round($netCogs, 2),
                'gross_profit'       => round($grossProfit, 2),
                'gross_margin_pct'   => $grossMarginPct,
                'total_expenses'     => round($totalExpenses, 2),
                'total_charges'      => round($totalCharges, 2),
                'total_salaries'     => round($totalSalaries, 2),
                'total_losses'       => round($totalLossesValue, 2),
                'net_profit'         => round($netProfit, 2),
                'net_margin_pct'     => $netMarginPct,
            ],

            // Monthly KPIs (flux detail)
            'monthLabel'    => ucfirst($selectedDate->locale('fr')->isoFormat('MMMM YYYY')),
            'selectedMonth' => $month,
            'selectedYear'  => $year,
            'kpis' => [
                'ca_brut'           => round($caBrut, 2),
                'ca_net'            => round($caNet, 2),
                'retours_clients'   => round($retoursClients, 2),
                'encaissements'     => round($encaissements, 2),
                'achats_nets'       => round($achatsNets, 2),
                'retours_four_remb' => round($retoursFourRemb, 2),
                'charges_total'     => round($chargesMonth, 2),
                'salaires_payes'    => round($salairesMonth, 2),
                'total_sorties'     => round($totalSorties, 2),
                'benefice_net'      => round($benefice, 2),
                'marge_nette'       => $marge,
            ],
            'soldes' => [
                'clients'      => round($soldeClients, 2),
                'fournisseurs' => round($soldeFournisseurs, 2),
            ],
            'monthlyTrend'       => $monthlyTrend,
            'repartitionSorties' => $repartition,
        ]);
    }

    /* ─────────────────────────────────────────────────────
     |  Update initial capital (deposit)
     ───────────────────────────────────────────────────── */
    public function updateCapital(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'mode'   => 'required|in:set,add',
        ]);

        $account = BusinessAccount::main();

        if ($validated['mode'] === 'set') {
            $account->update(['initial_capital' => $validated['amount']]);
        } else {
            $account->increment('initial_capital', $validated['amount']);
        }

        return back()->with('success', 'Capital mis à jour.');
    }
}
