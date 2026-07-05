<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientTransaction;
use App\Models\DamagedStock;
use App\Models\PaymentMethod;
use App\Models\Produit;
use App\Models\CompanyProfile;
use App\Models\Supplier;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ClientTransactionController extends Controller
{
    /* ------------------------------------------------------------------ */
    /*  F — Sell                                                            */
    /* ------------------------------------------------------------------ */

    public function sell(Client $client)
    {
        return Inertia::render('clients/Sell', [
            'client'   => $client->only(['uuid', 'nom', 'telephone']),
            'products' => Produit::select('id', 'nom', 'sale_price', 'stock_quantity', 'stock_alert_threshold')
                ->orderBy('nom')->get(),
        ]);
    }

    public function storeSell(Request $request, Client $client)
    {
        $validated = $request->validate([
            'items'               => 'required|array|min:1',
            'items.*.product_id'  => 'required|exists:produits,id',
            'items.*.quantity'    => 'required|integer|min:1',
            'items.*.unit_price'  => 'required|numeric|min:0',
            'notes'               => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($validated, $client) {
                foreach ($validated['items'] as $item) {
                    $product = Produit::findOrFail($item['product_id']);

                    if ($product->stock_quantity < $item['quantity']) {
                        throw new \Exception(
                            "Stock insuffisant pour « {$product->nom} » — disponible : {$product->stock_quantity}, demandé : {$item['quantity']}."
                        );
                    }

                    ClientTransaction::create([
                        'client_id'    => $client->id,
                        'type'         => 'F',
                        'product_id'   => $product->id,
                        'product_name' => $product->nom,
                        'quantity'     => $item['quantity'],
                        'unit_price'   => $item['unit_price'],
                        'total_price'  => $item['unit_price'] * $item['quantity'],
                        'notes'        => $validated['notes'] ?? null,
                    ]);

                    $product->decrement('stock_quantity', $item['quantity']);
                }
            });
        } catch (\Exception $e) {
            return redirect()->back()->withInput()->withErrors(['sell_error' => $e->getMessage()]);
        }

        return redirect()->route('clients.ledger', $client)
            ->with('success', 'Vente enregistrée avec succès.');
    }

    /* ------------------------------------------------------------------ */
    /*  R — Return                                                          */
    /* ------------------------------------------------------------------ */

    public function returnForm(Client $client)
    {
        $sells = ClientTransaction::where('client_id', $client->id)
            ->where('type', 'F')
            ->whereNotNull('product_id')
            ->get();

        $returns = ClientTransaction::where('client_id', $client->id)
            ->where('type', 'R')
            ->whereNotNull('product_id')
            ->get()
            ->groupBy('product_id');

        $returnableProducts = $sells
            ->groupBy('product_id')
            ->map(function ($txns, $productId) use ($returns) {
                $totalPurchased = $txns->sum('quantity');
                $totalReturned  = isset($returns[$productId])
                    ? $returns[$productId]->sum('quantity')
                    : 0;
                $available = $totalPurchased - $totalReturned;

                if ($available <= 0) return null;

                return [
                    'product_id'      => (int) $productId,
                    'product_name'    => $txns->first()->product_name,
                    'total_purchased' => $totalPurchased,
                    'total_returned'  => $totalReturned,
                    'available'       => $available,
                    'unit_price'      => round($txns->avg('unit_price'), 2),
                ];
            })
            ->filter()
            ->values();

        return Inertia::render('clients/Return', [
            'client'             => $client->only(['uuid', 'nom', 'telephone']),
            'returnableProducts' => $returnableProducts,
        ]);
    }

    public function storeReturn(Request $request, Client $client)
    {
        $validated = $request->validate([
            'items'                  => 'required|array|min:1',
            'items.*.product_id'     => 'required|integer',
            'items.*.quantity'       => 'required|integer|min:1',
            'items.*.return_type'    => 'required|in:stock,damaged',
            'notes'                  => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($validated, $client) {
                foreach ($validated['items'] as $item) {
                    $totalPurchased = ClientTransaction::where('client_id', $client->id)
                        ->where('type', 'F')->where('product_id', $item['product_id'])->sum('quantity');

                    $totalReturned = ClientTransaction::where('client_id', $client->id)
                        ->where('type', 'R')->where('product_id', $item['product_id'])->sum('quantity');

                    $available = $totalPurchased - $totalReturned;

                    if ($item['quantity'] > $available) {
                        $name = ClientTransaction::where('client_id', $client->id)
                            ->where('product_id', $item['product_id'])->value('product_name') ?? 'inconnu';
                        throw new \Exception(
                            "Quantité trop élevée pour « {$name} » — max retournable : {$available}, demandé : {$item['quantity']}."
                        );
                    }

                    $avgPrice    = (float) ClientTransaction::where('client_id', $client->id)
                        ->where('type', 'F')->where('product_id', $item['product_id'])->avg('unit_price');
                    $productName = ClientTransaction::where('client_id', $client->id)
                        ->where('product_id', $item['product_id'])->value('product_name') ?? 'Produit';

                    $returnType = $item['return_type'];

                    $transaction = ClientTransaction::create([
                        'client_id'    => $client->id,
                        'type'         => 'R',
                        'product_id'   => $item['product_id'],
                        'product_name' => $productName,
                        'quantity'     => $item['quantity'],
                        'unit_price'   => round($avgPrice, 2),
                        'total_price'  => round($avgPrice * $item['quantity'], 2),
                        'notes'        => $validated['notes'] ?? null,
                        'return_type'  => $returnType,
                    ]);

                    if ($returnType === 'stock') {
                        Produit::find($item['product_id'])?->increment('stock_quantity', $item['quantity']);
                    } else {
                        DamagedStock::create([
                            'product_id'            => $item['product_id'],
                            'product_name'          => $productName,
                            'quantity'              => $item['quantity'],
                            'client_id'             => $client->id,
                            'client_transaction_id' => $transaction->id,
                        ]);
                    }
                }
            });
        } catch (\Exception $e) {
            return back()->withErrors(['return_error' => $e->getMessage()]);
        }

        return redirect()->route('clients.ledger', $client)
            ->with('success', 'Retour enregistré avec succès.');
    }

    /* ------------------------------------------------------------------ */
    /*  P — Payment                                                         */
    /* ------------------------------------------------------------------ */

    public function paymentForm(Client $client)
    {
        // Per-product outstanding amounts (F - R - P per product)
        $txns = ClientTransaction::where('client_id', $client->id)
            ->whereNotNull('product_id')
            ->get();

        $outstandingItems = $txns->groupBy('product_id')
            ->map(function ($productTxns, $productId) {
                $sold     = (float) $productTxns->where('type', 'F')->sum('total_price');
                $returned = (float) $productTxns->where('type', 'R')->sum('total_price');
                $paid     = (float) $productTxns->where('type', 'P')->sum('total_price');
                $owed     = $sold - $returned - $paid;

                if ($owed < 0.01) return null;

                $firstName = $productTxns->where('type', 'F')->first();
                return [
                    'product_id'   => (int) $productId,
                    'product_name' => $firstName ? $firstName->product_name : $productTxns->first()->product_name,
                    'amount_owed'  => round($owed, 2),
                ];
            })
            ->filter()
            ->values();

        // Overall balance
        $allTxns = ClientTransaction::where('client_id', $client->id)->get();
        $balance = $allTxns->reduce(fn ($c, $t) =>
            $c + ($t->type === 'F' ? (float) $t->total_price : -(float) $t->total_price), 0.0
        );

        $paymentMethods = PaymentMethod::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('clients/Payment', [
            'client'           => $client->only(['uuid', 'nom', 'telephone']),
            'balance'          => round($balance, 2),
            'outstandingItems' => $outstandingItems,
            'paymentMethods'   => $paymentMethods,
        ]);
    }

    public function storePayment(Request $request, Client $client)
    {
        $validated = $request->validate([
            'payments'                  => 'required|array|min:1',
            'payments.*.product_id'     => 'required|integer',
            'payments.*.product_name'   => 'required|string',
            'payments.*.amount'         => 'required|numeric|min:0.01',
            'reference'                 => 'nullable|string|max:255',
            'notes'                     => 'nullable|string',
        ]);

        // Server-side: ensure total paid doesn't exceed the client's overall balance
        $allTxns = ClientTransaction::where('client_id', $client->id)->get();
        $balance = $allTxns->reduce(fn ($c, $t) =>
            $c + ($t->type === 'F' ? (float) $t->total_price : -(float) $t->total_price), 0.0
        );
        $totalPaying = array_sum(array_column($validated['payments'], 'amount'));
        if (round($totalPaying, 2) > round($balance, 2) + 0.01) {
            return back()->withErrors([
                'payment_error' => 'Le total à payer (' . number_format($totalPaying, 2) . ') dépasse le solde dû (' . number_format($balance, 2) . ' MAD).',
            ]);
        }

        foreach ($validated['payments'] as $item) {
            $label = $validated['reference']
                ? $item['product_name'] . ' — ' . $validated['reference']
                : $item['product_name'];

            ClientTransaction::create([
                'client_id'    => $client->id,
                'type'         => 'P',
                'product_id'   => $item['product_id'],
                'product_name' => $label,
                'total_price'  => $item['amount'],
                'notes'        => $validated['notes'] ?? null,
            ]);
        }

        return redirect()->route('clients.ledger', $client)
            ->with('success', count($validated['payments']) . ' paiement(s) enregistré(s) avec succès.');
    }

    /* ------------------------------------------------------------------ */
    /*  History / Ledger                                                    */
    /* ------------------------------------------------------------------ */

    public function ledger(Request $request, Client $client)
    {
        $query = ClientTransaction::where('client_id', $client->id)
            ->orderBy('created_at', 'asc');

        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $transactions = $query->get();

        $rt = 0.0;
        $rows = $transactions->map(function ($t) use (&$rt) {
            if ($t->type === 'F') {
                $rt += (float) $t->total_price;
            } else {
                $rt -= (float) $t->total_price;
            }

            return [
                'uuid'          => $t->uuid,
                'type'          => $t->type,
                'product_name'  => $t->product_name,
                'quantity'      => $t->quantity,
                'unit_price'    => (float) $t->unit_price,
                'total_price'   => (float) $t->total_price,
                'running_total' => round($rt, 2),
                'notes'         => $t->notes,
                'created_at'    => $t->created_at->toIso8601String(),
            ];
        })->reverse()->values();

        // Overall balance (unfiltered)
        $allTxns = ClientTransaction::where('client_id', $client->id)->get();
        $balance = $allTxns->reduce(fn ($c, $t) =>
            $c + ($t->type === 'F' ? (float) $t->total_price : -(float) $t->total_price), 0.0
        );

        return Inertia::render('clients/Ledger', [
            'client'       => $client->only(['uuid', 'nom', 'email', 'telephone', 'ville']),
            'transactions' => $rows,
            'balance'      => round($balance, 2),
            'filters'      => [
                'date_from' => $request->date_from ?? '',
                'date_to'   => $request->date_to   ?? '',
            ],
        ]);
    }

    public function ledgerPdf(Request $request, Client $client)
    {
        $query = ClientTransaction::where('client_id', $client->id)
            ->orderBy('created_at', 'asc');

        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $transactions = $query->get();

        // Opening balance = RT of all transactions before the filter start
        $openingBalance = 0.0;
        if ($request->date_from) {
            $prior = ClientTransaction::where('client_id', $client->id)
                ->whereDate('created_at', '<', $request->date_from)
                ->get();
            $openingBalance = $prior->reduce(fn ($c, $t) =>
                $c + ($t->type === 'F' ? (float) $t->total_price : -(float) $t->total_price), 0.0
            );
        }

        $rt = $openingBalance;
        $rows = $transactions->map(function ($t) use (&$rt) {
            $rt += $t->type === 'F' ? (float) $t->total_price : -(float) $t->total_price;
            return [
                'type'          => $t->type,
                'product_name'  => $t->product_name,
                'quantity'      => $t->quantity,
                'unit_price'    => (float) $t->unit_price,
                'total_price'   => (float) $t->total_price,
                'running_total' => round($rt, 2),
                'notes'         => $t->notes,
                'created_at'    => $t->created_at->format('d/m/Y H:i'),
            ];
        });

        // Period totals (filtered)
        $totalF  = $transactions->where('type', 'F')->sum('total_price');
        $totalR  = $transactions->where('type', 'R')->sum('total_price');
        $totalP  = $transactions->where('type', 'P')->sum('total_price');

        // Overall balance (unfiltered — the real outstanding amount)
        $allTxns = ClientTransaction::where('client_id', $client->id)->get();
        $balance = $allTxns->reduce(fn ($c, $t) =>
            $c + ($t->type === 'F' ? (float) $t->total_price : -(float) $t->total_price), 0.0
        );
        $balance = round($balance, 2);

        $company  = (CompanyProfile::first() ?? new CompanyProfile())->toArray();
        $dateFrom = $request->date_from ? \Carbon\Carbon::parse($request->date_from)->format('d/m/Y') : null;
        $dateTo   = $request->date_to   ? \Carbon\Carbon::parse($request->date_to)->format('d/m/Y')   : null;

        $pdf = Pdf::loadView('clients.ledger_pdf', compact(
            'client', 'rows', 'company',
            'totalF', 'totalR', 'totalP', 'balance',
            'openingBalance', 'dateFrom', 'dateTo'
        ))->setPaper('a4', 'portrait');

        $namePart = \Str::slug($client->nom);
        $datePart = $request->date_from && $request->date_to
            ? '_' . $request->date_from . '_au_' . $request->date_to
            : ($request->date_from ? '_depuis_' . $request->date_from
            : ($request->date_to   ? '_jusqu_' . $request->date_to : ''));
        return $pdf->download("grand-livre-{$namePart}{$datePart}.pdf");
    }

    /* ------------------------------------------------------------------ */
    /*  Global Listings                                                     */
    /* ------------------------------------------------------------------ */

    public function paymentsList(Request $request)
    {
        $query = ClientTransaction::with('client')
            ->where('type', 'P')
            ->orderBy('created_at', 'desc');

        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('product_name', 'like', "%{$request->search}%")
                  ->orWhereHas('client', fn ($q2) => $q2->where('nom', 'like', "%{$request->search}%"));
            });
        }

        $payments = $query->paginate(25)->withQueryString();

        $total = ClientTransaction::where('type', 'P')->sum('total_price');

        return Inertia::render('Payments', [
            'payments' => $payments->through(fn ($t) => [
                'uuid'         => $t->uuid,
                'client_uuid'  => $t->client->uuid,
                'client_nom'   => $t->client->nom,
                'product_name' => $t->product_name,
                'total_price'  => (float) $t->total_price,
                'notes'        => $t->notes,
                'created_at'   => $t->created_at->toIso8601String(),
            ]),
            'total'   => round((float) $total, 2),
            'filters' => [
                'date_from' => $request->date_from ?? '',
                'date_to'   => $request->date_to   ?? '',
                'search'    => $request->search    ?? '',
            ],
        ]);
    }

    public function stockList(Request $request)
    {
        $query = DamagedStock::with('client', 'product')
            ->orderBy('created_at', 'desc');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('product_name', 'like', "%{$request->search}%")
                  ->orWhereHas('client', fn ($q2) => $q2->where('nom', 'like', "%{$request->search}%"));
            });
        }

        $records = $query->paginate(25)->withQueryString();

        $totalQty = DamagedStock::sum('quantity');

        $suppliers = Supplier::orderBy('nom')->get(['uuid', 'nom'])->map(fn ($s) => [
            'uuid' => $s->uuid,
            'nom'  => $s->nom,
        ]);

        return Inertia::render('Stock', [
            'records'  => $records->through(fn ($r) => [
                'id'           => $r->id,
                'product_name' => $r->product_name,
                'quantity'     => $r->quantity,
                'client_uuid'  => $r->client->uuid,
                'client_nom'   => $r->client->nom,
                'created_at'   => $r->created_at->toIso8601String(),
            ]),
            'totalQty'  => (int) $totalQty,
            'suppliers' => $suppliers,
            'filters'   => ['search' => $request->search ?? ''],
        ]);
    }
}
