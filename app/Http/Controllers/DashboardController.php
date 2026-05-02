<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientTransaction;
use App\Models\DamagedStock;
use App\Models\Produit;
use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        /* ── Period filter ── */
        $period   = $request->get('period', 'month');
        $dateFrom = $request->get('date_from');
        $dateTo   = $request->get('date_to');

        [$from, $to] = match ($period) {
            'day'    => [now()->startOfDay(),              now()->endOfDay()],
            'week'   => [now()->subDays(6)->startOfDay(),  now()->endOfDay()],
            'year'   => [now()->startOfYear(),             now()->endOfYear()],
            'custom' => [
                $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : now()->subDays(29)->startOfDay(),
                $dateTo   ? Carbon::parse($dateTo)->endOfDay()     : now()->endOfDay(),
            ],
            default  => [now()->subDays(29)->startOfDay(), now()->endOfDay()],
        };

        /* ── Chart grouping ── */
        $diffDays = (int) $from->diffInDays($to);

        if ($period === 'day') {
            $sqlFmt = '%H';
            $keys   = collect(range(0, 23))->map(fn ($h) => str_pad($h, 2, '0', STR_PAD_LEFT));
            $labels = $keys->map(fn ($h) => $h . ':00');
        } elseif ($period === 'year' || $diffDays > 60) {
            $sqlFmt = '%Y-%m';
            $months = collect();
            $cur    = $from->copy()->startOfMonth();
            while ($cur->lte($to)) {
                $months->push($cur->format('Y-m'));
                $cur->addMonth();
            }
            $keys   = $months;
            $labels = $months->map(fn ($m) => Carbon::createFromFormat('Y-m', $m)->locale('fr')->isoFormat('MMM YY'));
        } else {
            $sqlFmt = '%Y-%m-%d';
            $keys   = collect(range($diffDays, 0))
                ->map(fn ($d) => $to->copy()->subDays($d)->format('Y-m-d'));
            $labels = $keys->map(fn ($d) => Carbon::parse($d)->format('d/m'));
        }

        /* ── Group transactions by period ── */
        $grpTxn = function (string $type) use ($from, $to, $sqlFmt) {
            return ClientTransaction::where('type', $type)
                ->whereBetween('created_at', [$from, $to])
                ->selectRaw("DATE_FORMAT(created_at, '{$sqlFmt}') as grp, SUM(total_price) as total")
                ->groupBy('grp')
                ->pluck('total', 'grp');
        };

        $dataF = $grpTxn('F');
        $dataR = $grpTxn('R');
        $dataP = $grpTxn('P');

        $trendData = $keys->values()->map(fn ($k, $i) => [
            'label'    => $labels->values()[$i] ?? $k,
            'sales'    => round((float) ($dataF[$k] ?? 0), 2),
            'returns'  => round((float) ($dataR[$k] ?? 0), 2),
            'payments' => round((float) ($dataP[$k] ?? 0), 2),
        ])->values();

        /* ── Filtered aggregates ── */
        $totalF     = (float) ClientTransaction::whereBetween('created_at', [$from, $to])->where('type', 'F')->sum('total_price');
        $totalR     = (float) ClientTransaction::whereBetween('created_at', [$from, $to])->where('type', 'R')->sum('total_price');
        $totalP     = (float) ClientTransaction::whereBetween('created_at', [$from, $to])->where('type', 'P')->sum('total_price');
        $crmBalance = round($totalF - $totalR - $totalP, 2);

        /* ── Top 5 clients by sales (filtered period) ── */
        $topClients = ClientTransaction::whereBetween('client_transactions.created_at', [$from, $to])
            ->where('client_transactions.type', 'F')
            ->join('clients', 'clients.id', '=', 'client_transactions.client_id')
            ->selectRaw('clients.uuid, clients.nom, SUM(client_transactions.total_price) as total_purchased')
            ->groupBy('clients.id', 'clients.uuid', 'clients.nom')
            ->orderByDesc('total_purchased')
            ->take(5)->get()
            ->map(fn ($r) => [
                'uuid'            => $r->uuid,
                'nom'             => $r->nom,
                'total_purchased' => round((float) $r->total_purchased, 2),
            ]);

        /* ── Recent 8 transactions (always unfiltered) ── */
        $recentTxns = ClientTransaction::with('client')->latest()->take(8)->get()
            ->map(fn ($t) => [
                'uuid'         => $t->uuid         ?? '',
                'type'         => $t->type         ?? 'F',
                'client_uuid'  => $t->client?->uuid ?? '',
                'client_nom'   => $t->client?->nom  ?? 'N/A',
                'product_name' => $t->product_name  ?? null,
                'total_price'  => (float) ($t->total_price ?? 0),
                'created_at'   => $t->created_at?->toIso8601String() ?? '',
            ]);

        return Inertia::render('dashboard', [
            'crm' => [
                'total_f'   => round($totalF, 2),
                'total_r'   => round($totalR, 2),
                'total_p'   => round($totalP, 2),
                'balance'   => $crmBalance,
                'txn_count' => ClientTransaction::whereBetween('created_at', [$from, $to])->count(),
            ],
            'counts' => [
                'clients'        => Client::count(),
                'active_clients' => Client::where('status', 'active')->count(),
                'suppliers'      => Supplier::count(),
                'products'       => Produit::count(),
                'low_stock'      => Produit::where('stock_quantity', '<=', 5)->count(),
                'damaged_qty'    => (int) DamagedStock::sum('quantity'),
            ],
            'trendData'        => $trendData,
            'topClients'       => $topClients,
            'recentTxns'       => $recentTxns,
            'lowStockProducts' => Produit::where('stock_quantity', '<=', 5)
                ->orderBy('stock_quantity')->take(6)->get(['uuid', 'nom', 'sku', 'stock_quantity']),
            'filters' => [
                'period'    => $period,
                'date_from' => $dateFrom ?? '',
                'date_to'   => $dateTo   ?? '',
            ],
        ]);
    }
}
