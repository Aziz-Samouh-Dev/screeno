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
    /*  F — Purchase (Facture)                                              */
    /* ------------------------------------------------------------------ */

    public function purchaseForm(Supplier $supplier)
    {
        return Inertia::render('suppliers/Purchase', [
            'supplier' => $supplier->only(['uuid', 'nom', 'telephone']),
            'products' => Produit::select('id', 'nom', 'purchase_price', 'stock_quantity', 'stock_alert_threshold', 'supplier_id')
                ->orderBy('nom')->get(),
        ]);
    }

    public function storePurchase(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:produits,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'notes'              => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($validated, $supplier) {
                foreach ($validated['items'] as $item) {
                    $product = Produit::findOrFail($item['product_id']);

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

                    // Receiving stock from supplier
                    $product->increment('stock_quantity', $item['quantity']);

                    // Auto-link product to this supplier if not yet linked
                    if (is_null($product->supplier_id)) {
                        $product->update(['supplier_id' => $supplier->id]);
                    }
                }
            });
        } catch (\Exception $e) {
            return back()->withErrors(['purchase_error' => $e->getMessage()]);
        }

        return redirect()->route('suppliers.ledger', $supplier)
            ->with('success', 'Achat enregistré avec succès.');
    }

    /* ------------------------------------------------------------------ */
    /*  R — Return to Supplier                                              */
    /* ------------------------------------------------------------------ */

    public function returnForm(Supplier $supplier)
    {
        // Products purchased from this supplier with remaining returnable qty
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
                foreach ($validated['items'] as $item) {
                    $totalPurchased = SupplierTransaction::where('supplier_id', $supplier->id)
                        ->where('type', 'F')->where('product_id', $item['product_id'])->sum('quantity');
                    $totalReturned = SupplierTransaction::where('supplier_id', $supplier->id)
                        ->where('type', 'R')->where('product_id', $item['product_id'])->sum('quantity');
                    $available = $totalPurchased - $totalReturned;

                    if ($item['quantity'] > $available) {
                        $name = SupplierTransaction::where('supplier_id', $supplier->id)
                            ->where('product_id', $item['product_id'])->value('product_name') ?? 'inconnu';
                        throw new \Exception(
                            "Quantité trop élevée pour « {$name} » — max retournable : {$available}."
                        );
                    }

                    $avgPrice    = (float) SupplierTransaction::where('supplier_id', $supplier->id)
                        ->where('type', 'F')->where('product_id', $item['product_id'])->avg('unit_price');
                    $productName = SupplierTransaction::where('supplier_id', $supplier->id)
                        ->where('product_id', $item['product_id'])->value('product_name') ?? 'Produit';
                    $returnType  = $item['return_type'];

                    // Financial impact: only 'refund' reduces what we owe the supplier
                    $totalPrice = $returnType === 'refund'
                        ? round($avgPrice * $item['quantity'], 2)
                        : 0;

                    SupplierTransaction::create([
                        'supplier_id'  => $supplier->id,
                        'type'         => 'R',
                        'product_id'   => $item['product_id'],
                        'product_name' => $productName,
                        'quantity'     => $item['quantity'],
                        'unit_price'   => round($avgPrice, 2),
                        'total_price'  => $totalPrice,
                        'return_type'  => $returnType,
                        'notes'        => $validated['notes'] ?? null,
                    ]);

                    // Stock impact:
                    // change = give damaged back, receive new → net 0
                    // refund = we give product back → stock decreases
                    // loss   = product gone, supplier refused → stock decreases
                    if ($returnType === 'refund' || $returnType === 'loss') {
                        Produit::find($item['product_id'])?->decrement('stock_quantity', $item['quantity']);
                    }
                    // 'change': no stock change (return damaged, receive new same product)
                }
            });
        } catch (\Exception $e) {
            return back()->withErrors(['return_error' => $e->getMessage()]);
        }

        return redirect()->route('suppliers.ledger', $supplier)
            ->with('success', 'Retour enregistré avec succès.');
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
            // F = we owe more; R/refund = we owe less; change/loss = no financial change
            if ($t->type === 'F') {
                $rt += (float) $t->total_price;
            } elseif ($t->type === 'R' && $t->return_type === 'refund') {
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

        // Overall balance (unfiltered)
        $allTxns = SupplierTransaction::where('supplier_id', $supplier->id)->get();
        $balance = $this->computeBalance($allTxns);

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

    private function computeBalance($txns): float
    {
        return $txns->reduce(function ($carry, $t) {
            if ($t->type === 'F') return $carry + (float) $t->total_price;
            if ($t->type === 'R' && $t->return_type === 'refund') return $carry - (float) $t->total_price;
            return $carry;
        }, 0.0);
    }
}
