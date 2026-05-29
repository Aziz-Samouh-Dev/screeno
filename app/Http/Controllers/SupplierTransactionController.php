<?php

namespace App\Http\Controllers;

use App\Models\Produit;
use App\Models\Supplier;
use App\Models\SupplierTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SupplierTransactionController extends Controller
{
    /* ------------------------------------------------------------------ */
    /*  F — Purchase                                                        */
    /* ------------------------------------------------------------------ */

    public function purchaseForm(Supplier $supplier)
    {
        return Inertia::render('suppliers/Purchase', [
            'supplier' => $supplier->only(['uuid', 'nom', 'telephone']),
            'products' => Produit::select('id', 'nom', 'purchase_price', 'sale_price', 'stock_quantity', 'stock_alert_threshold')
                ->orderBy('nom')->get(),
        ]);
    }

    public function storePurchase(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'items'                     => 'required|array|min:1',
            'items.*.product_id'        => 'required|integer',
            'items.*.quantity'          => 'required|integer|min:1',
            'items.*.unit_price'        => 'required|numeric|min:0',
            'items.*.is_new'            => 'nullable|boolean',
            'items.*.product_name'      => 'required_if:items.*.is_new,true|string|max:255',
            'items.*.sale_price'        => 'required_if:items.*.is_new,true|numeric|min:0',
            'items.*.stock_alert_threshold' => 'nullable|integer|min:0',
            'notes'                     => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($validated, $supplier) {
                foreach ($validated['items'] as $item) {
                    if (!empty($item['is_new'])) {
                        $product = Produit::create([
                            'nom'                   => $item['product_name'],
                            'purchase_price'         => $item['unit_price'],
                            'sale_price'             => $item['sale_price'],
                            'stock_quantity'         => 0,
                            'stock_alert_threshold'  => $item['stock_alert_threshold'] ?? 10,
                            'supplier_id'            => $supplier->id,
                        ]);
                    } else {
                        $product = Produit::findOrFail($item['product_id']);
                        if (is_null($product->supplier_id)) {
                            $product->update(['supplier_id' => $supplier->id]);
                        }
                    }

                    SupplierTransaction::create([
                        'supplier_id'  => $supplier->id,
                        'type'         => 'F',
                        'product_id'   => $product->id,
                        'product_name' => $product->nom,
                        'quantity'     => $item['quantity'],
                        'unit_price'   => $item['unit_price'],
                        'total_price'  => $item['unit_price'] * $item['quantity'],
                        'notes'        => $validated['notes'] ?? null,
                    ]);

                    $product->increment('stock_quantity', $item['quantity']);
                }
            });
        } catch (\Exception $e) {
            return redirect()->back()->withInput()->withErrors(['purchase_error' => $e->getMessage()]);
        }

        return redirect()->route('suppliers.ledger', $supplier)
            ->with('success', 'Achat enregistré avec succès.');
    }

    /* ------------------------------------------------------------------ */
    /*  R — Return                                                          */
    /* ------------------------------------------------------------------ */

    public function returnForm(Supplier $supplier)
    {
        $purchases = SupplierTransaction::where('supplier_id', $supplier->id)
            ->where('type', 'F')->whereNotNull('product_id')->get();

        $returns = SupplierTransaction::where('supplier_id', $supplier->id)
            ->where('type', 'R')->whereNotNull('product_id')
            ->get()->groupBy('product_id');

        $returnableProducts = $purchases
            ->groupBy('product_id')
            ->map(function ($txns, $productId) use ($returns) {
                $totalPurchased = $txns->sum('quantity');
                $totalReturned  = isset($returns[$productId])
                    ? $returns[$productId]->sum('quantity') : 0;
                $available = $totalPurchased - $totalReturned;
                if ($available <= 0) return null;

                $product = Produit::find($productId);
                return [
                    'product_id'      => (int) $productId,
                    'product_name'    => $txns->first()->product_name,
                    'total_purchased' => $totalPurchased,
                    'total_returned'  => $totalReturned,
                    'available'       => $available,
                    'stock_quantity'  => $product?->stock_quantity ?? 0,
                    'unit_price'      => round($txns->avg('unit_price'), 2),
                ];
            })
            ->filter()->values();

        return Inertia::render('suppliers/Return', [
            'supplier'           => $supplier->only(['uuid', 'nom', 'telephone']),
            'returnableProducts' => $returnableProducts,
        ]);
    }

    public function storeReturn(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'items'               => 'required|array|min:1',
            'items.*.product_id'  => 'required|integer',
            'items.*.quantity'    => 'required|integer|min:1',
            'items.*.return_type' => 'required|in:change,refund,loss',
            'notes'               => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($validated, $supplier) {
                // Track quantities being returned in this submission per product
                $inFlight = [];

                foreach ($validated['items'] as $item) {
                    $pid = (int) $item['product_id'];

                    $totalPurchased = SupplierTransaction::where('supplier_id', $supplier->id)
                        ->where('type', 'F')->where('product_id', $pid)->sum('quantity');
                    $totalReturned  = SupplierTransaction::where('supplier_id', $supplier->id)
                        ->where('type', 'R')->where('product_id', $pid)->sum('quantity');

                    // Add already-submitted qty for this product in this request
                    $alreadyThisRequest = $inFlight[$pid] ?? 0;
                    $available = $totalPurchased - $totalReturned - $alreadyThisRequest;

                    if ($item['quantity'] > $available) {
                        $name = SupplierTransaction::where('supplier_id', $supplier->id)
                            ->where('product_id', $pid)->value('product_name') ?? 'inconnu';
                        throw new \Exception(
                            "Quantité trop élevée pour « {$name} » — max retournable : {$available}."
                        );
                    }

                    $inFlight[$pid] = $alreadyThisRequest + $item['quantity'];

                    $avgPrice    = (float) SupplierTransaction::where('supplier_id', $supplier->id)
                        ->where('type', 'F')->where('product_id', $pid)->avg('unit_price');
                    $productName = SupplierTransaction::where('supplier_id', $supplier->id)
                        ->where('product_id', $pid)->value('product_name') ?? 'Produit';
                    $returnType  = $item['return_type'];
                    $totalPrice  = $returnType === 'refund' ? round($avgPrice * $item['quantity'], 2) : 0;

                    SupplierTransaction::create([
                        'supplier_id'  => $supplier->id,
                        'type'         => 'R',
                        'product_id'   => $pid,
                        'product_name' => $productName,
                        'quantity'     => $item['quantity'],
                        'unit_price'   => round($avgPrice, 2),
                        'total_price'  => $totalPrice,
                        'return_type'  => $returnType,
                        'notes'        => $validated['notes'] ?? null,
                    ]);

                    if ($returnType === 'refund' || $returnType === 'loss') {
                        Produit::find($pid)?->decrement('stock_quantity', $item['quantity']);
                    }
                }
            });
        } catch (\Exception $e) {
            return back()->withErrors(['return_error' => $e->getMessage()]);
        }

        return redirect()->route('suppliers.ledger', $supplier)
            ->with('success', 'Retour enregistré avec succès.');
    }

    /* ------------------------------------------------------------------ */
    /*  P — Payment                                                         */
    /* ------------------------------------------------------------------ */

    public function paymentForm(Supplier $supplier)
    {
        $txns = SupplierTransaction::where('supplier_id', $supplier->id)
            ->whereNotNull('product_id')->get();

        $outstandingItems = $txns->groupBy('product_id')
            ->map(function ($productTxns) {
                $purchased = (float) $productTxns->where('type', 'F')->sum('total_price');
                $returned  = (float) $productTxns->where('type', 'R')->sum('total_price');
                $paid      = (float) $productTxns->where('type', 'P')->sum('total_price');
                $owed      = $purchased - $returned - $paid;

                if ($owed < 0.01) return null;

                $firstName = $productTxns->where('type', 'F')->first();
                return [
                    'product_id'   => (int) $productTxns->first()->product_id,
                    'product_name' => $firstName ? $firstName->product_name : $productTxns->first()->product_name,
                    'amount_owed'  => round($owed, 2),
                ];
            })->filter()->values();

        $allTxns = SupplierTransaction::where('supplier_id', $supplier->id)->get();
        $balance = $allTxns->reduce(function ($c, $t) {
            if ($t->type === 'F') return $c + (float) $t->total_price;
            if ($t->type === 'R' && $t->return_type === 'refund') return $c - (float) $t->total_price;
            return $c;
        }, 0.0);

        $paymentMethods = \App\Models\PaymentMethod::where('is_active', true)
            ->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('suppliers/Payment', [
            'supplier'         => $supplier->only(['uuid', 'nom', 'telephone']),
            'balance'          => round($balance, 2),
            'outstandingItems' => $outstandingItems,
            'paymentMethods'   => $paymentMethods,
        ]);
    }

    public function storePayment(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'payments'                => 'required|array|min:1',
            'payments.*.product_id'   => 'required|integer',
            'payments.*.product_name' => 'required|string',
            'payments.*.amount'       => 'required|numeric|min:0.01',
            'reference'               => 'nullable|string|max:255',
            'notes'                   => 'nullable|string',
        ]);

        $allTxns = SupplierTransaction::where('supplier_id', $supplier->id)->get();
        $balance = $allTxns->reduce(function ($c, $t) {
            if ($t->type === 'F') return $c + (float) $t->total_price;
            if ($t->type === 'R' && $t->return_type === 'refund') return $c - (float) $t->total_price;
            return $c;
        }, 0.0);

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

            SupplierTransaction::create([
                'supplier_id'  => $supplier->id,
                'type'         => 'P',
                'product_id'   => $item['product_id'],
                'product_name' => $label,
                'total_price'  => $item['amount'],
                'notes'        => $validated['notes'] ?? null,
            ]);
        }

        return redirect()->route('suppliers.ledger', $supplier)
            ->with('success', count($validated['payments']) . ' paiement(s) enregistré(s) avec succès.');
    }

    /* ------------------------------------------------------------------ */
    /*  Ledger                                                              */
    /* ------------------------------------------------------------------ */

    public function ledger(Request $request, Supplier $supplier)
    {
        $query = SupplierTransaction::where('supplier_id', $supplier->id)
            ->orderBy('created_at', 'asc');

        if ($request->date_from) $query->whereDate('created_at', '>=', $request->date_from);
        if ($request->date_to)   $query->whereDate('created_at', '<=', $request->date_to);

        $transactions = $query->get();

        $rt = 0.0;
        $rows = $transactions->map(function ($t) use (&$rt) {
            if ($t->type === 'F') {
                $rt += (float) $t->total_price;
            } elseif ($t->type === 'R' && $t->return_type === 'refund') {
                $rt -= (float) $t->total_price;
            } elseif ($t->type === 'P') {
                $rt -= (float) $t->total_price;
            }
            return [
                'uuid'         => $t->uuid,
                'type'         => $t->type,
                'return_type'  => $t->return_type,
                'product_name' => $t->product_name,
                'quantity'     => $t->quantity,
                'unit_price'   => (float) $t->unit_price,
                'total_price'  => (float) $t->total_price,
                'running_total'=> round($rt, 2),
                'notes'        => $t->notes,
                'created_at'   => $t->created_at->toIso8601String(),
            ];
        })->reverse()->values();

        $allTxns = SupplierTransaction::where('supplier_id', $supplier->id)->get();
        $balance = $allTxns->reduce(function ($c, $t) {
            if ($t->type === 'F') return $c + (float) $t->total_price;
            if ($t->type === 'P') return $c - (float) $t->total_price;
            if ($t->type === 'R' && $t->return_type === 'refund') return $c - (float) $t->total_price;
            return $c;
        }, 0.0);

        return Inertia::render('suppliers/Ledger', [
            'supplier'     => $supplier->only(['uuid', 'nom', 'email', 'telephone', 'ville']),
            'transactions' => $rows,
            'balance'      => round($balance, 2),
            'filters'      => [
                'date_from' => $request->date_from ?? '',
                'date_to'   => $request->date_to   ?? '',
            ],
        ]);
    }
}
