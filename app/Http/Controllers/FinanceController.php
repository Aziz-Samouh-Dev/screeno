<?php

namespace App\Http\Controllers;

use App\Models\Charge;
use App\Models\ClientTransaction;
use App\Models\EmployeePayment;
use App\Models\SupplierTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FinanceController extends Controller
{
    public function index(Request $request)
    {
        $now   = now();
        $month = $request->filled('month') ? (int) $request->month : (int) $now->month;
        $year  = $request->filled('year')  ? (int) $request->year  : (int) $now->year;

        /* ──────────────────────────────────────────────────────
         |  ENTRÉES (money coming in) — current month
         ────────────────────────────────────────────────────── */

        // Ventes clients (factures)
        $caBrut = (float) ClientTransaction::where('type', 'F')
            ->whereMonth('created_at', $month)->whereYear('created_at', $year)
            ->sum('total_price');

        // Retours clients (money given back to clients)
        $retoursClients = (float) ClientTransaction::where('type', 'R')
            ->whereMonth('created_at', $month)->whereYear('created_at', $year)
            ->sum('total_price');

        // Paiements reçus de clients (encaissements)
        $encaissements = (float) ClientTransaction::where('type', 'P')
            ->whereMonth('created_at', $month)->whereYear('created_at', $year)
            ->sum('total_price');

        // Retours fournisseurs remboursés (on récupère de l'argent du fournisseur)
        $retoursFourRemb = (float) SupplierTransaction::where('type', 'R')
            ->where('return_type', 'refund')
            ->whereMonth('created_at', $month)->whereYear('created_at', $year)
            ->sum('total_price');

        $caNet = $caBrut - $retoursClients;

        /* ──────────────────────────────────────────────────────
         |  SORTIES (money going out) — current month
         ────────────────────────────────────────────────────── */

        // Achats fournisseurs (brut)
        $achatsBruts = (float) SupplierTransaction::where('type', 'F')
            ->whereMonth('created_at', $month)->whereYear('created_at', $year)
            ->sum('total_price');

        // Paiements versés aux fournisseurs
        $decaissementsFour = (float) SupplierTransaction::where('type', 'P')
            ->whereMonth('created_at', $month)->whereYear('created_at', $year)
            ->sum('total_price');

        // Charges (loyer, énergie, taxes, etc.)
        $chargesTotal = (float) Charge::whereMonth('date', $month)->whereYear('date', $year)
            ->sum('amount');

        // Salaires payés aux employés
        $salairesPayes = (float) EmployeePayment::where('month', $month)->where('year', $year)
            ->sum('amount');

        $achatsNets    = max(0, $achatsBruts - $retoursFourRemb);
        $totalSorties  = $achatsNets + $chargesTotal + $salairesPayes;

        /* ──────────────────────────────────────────────────────
         |  RÉSULTAT
         ────────────────────────────────────────────────────── */
        $benefice = $caNet - $totalSorties;
        $marge    = $caBrut > 0 ? round(($benefice / $caBrut) * 100, 1) : 0.0;

        /* ──────────────────────────────────────────────────────
         |  MONTHLY TREND — last 6 months (all sources)
         ────────────────────────────────────────────────────── */
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

            $monthlyTrend[] = [
                'label'   => ucfirst($d->locale('fr')->isoFormat('MMM')),
                'revenue' => round(max(0, $rev), 2),
                'charges' => round(max(0, $exp), 2),
            ];
        }

        /* ──────────────────────────────────────────────────────
         |  RÉPARTITION DES SORTIES (current month, all sources)
         ────────────────────────────────────────────────────── */
        $repartition = [];

        if ($achatsNets > 0) {
            $repartition[] = ['key' => 'achats', 'label' => 'Achats marchandises', 'amount' => round($achatsNets, 2), 'color' => '#3b82f6'];
        }
        if ($salairesPayes > 0) {
            $repartition[] = ['key' => 'salaires_emp', 'label' => 'Salaires employés', 'amount' => round($salairesPayes, 2), 'color' => '#8b5cf6'];
        }

        $categoryLabels = [
            'loyer'     => 'Loyer',      'salaires'  => 'Salaires (charges)',
            'energie'   => 'Énergie',    'transport' => 'Transport',
            'taxes'     => 'Taxes',      'assurance' => 'Assurance',
            'telecom'   => 'Télécom',    'autre'     => 'Autre',
        ];
        $categoryColors = [
            'loyer'     => '#f59e0b', 'salaires'  => '#a78bfa',
            'energie'   => '#f97316', 'transport' => '#06b6d4',
            'taxes'     => '#ef4444', 'assurance' => '#10b981',
            'telecom'   => '#6366f1', 'autre'     => '#94a3b8',
        ];

        $byCategory = Charge::whereMonth('date', $month)->whereYear('date', $year)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')->get();

        foreach ($byCategory as $cat) {
            $repartition[] = [
                'key'    => $cat->category,
                'label'  => $categoryLabels[$cat->category] ?? $cat->category,
                'amount' => round((float) $cat->total, 2),
                'color'  => $categoryColors[$cat->category] ?? '#94a3b8',
            ];
        }

        usort($repartition, fn ($a, $b) => $b['amount'] <=> $a['amount']);

        /* ──────────────────────────────────────────────────────
         |  SOLDES GLOBAUX (all time, not filtered by month)
         ────────────────────────────────────────────────────── */
        $soldeClients    = (float) ClientTransaction::whereRaw("type='F'")->sum('total_price')
            - (float) ClientTransaction::whereRaw("type='R'")->sum('total_price')
            - (float) ClientTransaction::whereRaw("type='P'")->sum('total_price');

        $soldeFournisseurs = (float) SupplierTransaction::whereRaw("type='F'")->sum('total_price')
            - (float) SupplierTransaction::where('type', 'R')->where('return_type', 'refund')->sum('total_price')
            - (float) SupplierTransaction::whereRaw("type='P'")->sum('total_price');

        $selectedDate = \Carbon\Carbon::createFromDate($year, $month, 1);

        return Inertia::render('finances/Index', [
            'monthLabel'         => ucfirst($selectedDate->locale('fr')->isoFormat('MMMM YYYY')),
            'selectedMonth'      => $month,
            'selectedYear'       => $year,

            // Main KPIs
            'kpis' => [
                'ca_brut'            => round($caBrut, 2),
                'ca_net'             => round($caNet, 2),
                'retours_clients'    => round($retoursClients, 2),
                'encaissements'      => round($encaissements, 2),
                'achats_bruts'       => round($achatsBruts, 2),
                'achats_nets'        => round($achatsNets, 2),
                'retours_four_remb'  => round($retoursFourRemb, 2),
                'decaissements_four' => round($decaissementsFour, 2),
                'charges_total'      => round($chargesTotal, 2),
                'salaires_payes'     => round($salairesPayes, 2),
                'total_sorties'      => round($totalSorties, 2),
                'benefice_net'       => round($benefice, 2),
                'marge_nette'        => $marge,
            ],

            // All-time balances
            'soldes' => [
                'clients'      => round($soldeClients, 2),
                'fournisseurs' => round($soldeFournisseurs, 2),
            ],

            'monthlyTrend'       => $monthlyTrend,
            'repartitionSorties' => $repartition,
        ]);
    }
}
