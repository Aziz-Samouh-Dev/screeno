<?php

namespace App\Http\Controllers;

use App\Models\Produit;
use App\Models\Supplier;
use App\Models\SupplierTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $totalSuppliers    = Supplier::count();
        $activeSuppliers   = Supplier::where('status', 'active')->count();
        $inactiveSuppliers = Supplier::where('status', 'inactive')->count();

        $suppliers = Supplier::query()
            ->selectRaw("suppliers.*, ROUND(
                COALESCE((SELECT SUM(total_price) FROM supplier_transactions WHERE supplier_id = suppliers.id AND type = 'F'), 0) -
                COALESCE((SELECT SUM(total_price) FROM supplier_transactions WHERE supplier_id = suppliers.id AND type = 'R' AND return_type = 'refund'), 0) -
                COALESCE((SELECT SUM(total_price) FROM supplier_transactions WHERE supplier_id = suppliers.id AND type = 'P'), 0)
            , 2) as balance")
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('telephone', 'like', "%{$search}%");
                });
            })
            ->when($request->status, fn ($q, $s) => $s !== 'all' ? $q->where('status', $s) : $q)
            ->when($request->sort, function ($query, $sort) {
                $map = ['name' => 'nom', 'email' => 'email', 'city' => 'ville', 'status' => 'status'];
                if (str_contains($sort, '_')) {
                    [$field, $dir] = explode('_', $sort, 2);
                    if (isset($map[$field]) && in_array($dir, ['asc', 'desc'])) {
                        $query->orderBy($map[$field], $dir);
                        return;
                    }
                }
                $query->orderBy('created_at', 'desc');
            }, fn ($q) => $q->orderBy('created_at', 'desc'))
            ->paginate($request->per_page ?? 10)
            ->withQueryString();

        return Inertia::render('suppliers/Index', [
            'suppliers'   => $suppliers,
            'globalStats' => compact('totalSuppliers', 'activeSuppliers', 'inactiveSuppliers'),
            'filters'     => [
                'search'   => $request->search   ?? '',
                'status'   => $request->status   ?? 'all',
                'sort'     => $request->sort     ?? '',
                'per_page' => $request->per_page ?? '10',
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('suppliers/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'       => 'required|string|max:255',
            'telephone' => 'required|regex:/^[0-9+\-\s]+$/',
            'email'     => 'nullable|email|unique:suppliers,email',
            'adresse'   => 'nullable|string',
            'ville'     => 'nullable|string|max:255',
            'notes'     => 'nullable|string',
            'status'    => 'nullable|in:active,inactive',
        ]);
        $validated['status'] = $validated['status'] ?? 'active';

        Supplier::create($validated);

        return redirect()->route('suppliers.index')->with('success', 'Fournisseur créé avec succès.');
    }

    public function show(Supplier $supplier)
    {
        $transactions = SupplierTransaction::where('supplier_id', $supplier->id)
            ->orderBy('created_at', 'desc')->take(10)->get();

        $allTxns = SupplierTransaction::where('supplier_id', $supplier->id)->get();
        $balance = $allTxns->reduce(function ($c, $t) {
            if ($t->type === 'F') return $c + (float) $t->total_price;
            if ($t->type === 'P') return $c - (float) $t->total_price;
            if ($t->type === 'R' && $t->return_type === 'refund') return $c - (float) $t->total_price;
            return $c;
        }, 0.0);

        $totalPurchases = $allTxns->where('type', 'F')->sum('total_price');
        $totalReturns   = $allTxns->where('type', 'R')->sum('total_price');
        $totalPayments  = $allTxns->where('type', 'P')->sum('total_price');

        $products = Produit::where('supplier_id', $supplier->id)
            ->select('uuid', 'nom', 'sku', 'purchase_price', 'sale_price', 'stock_quantity', 'stock_alert_threshold', 'image')
            ->orderBy('nom')->get();

        return Inertia::render('suppliers/Show', [
            'supplier'       => array_merge(
                $supplier->only(['uuid', 'nom', 'email', 'telephone', 'adresse', 'ville', 'notes', 'status', 'created_at']),
                ['balance' => round($balance, 2)]
            ),
            'products'       => $products,
            'totalPurchases' => round($totalPurchases, 2),
            'totalReturns'   => round($totalReturns, 2),
            'totalPayments'  => round($totalPayments, 2),
            'transactions'   => $transactions->map(fn ($t) => [
                'uuid'         => $t->uuid,
                'type'         => $t->type,
                'return_type'  => $t->return_type,
                'product_name' => $t->product_name,
                'quantity'     => $t->quantity,
                'total_price'  => (float) $t->total_price,
                'created_at'   => $t->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function edit(Supplier $supplier)
    {
        return Inertia::render('suppliers/Edit', ['supplier' => $supplier]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'nom'       => 'required|string|max:255',
            'email'     => 'nullable|email|unique:suppliers,email,' . $supplier->id,
            'telephone' => 'required|regex:/^[0-9+\-\s]+$/',
            'adresse'   => 'nullable|string',
            'ville'     => 'nullable|string',
            'notes'     => 'nullable|string',
            'status'    => 'required|in:active,inactive',
        ]);

        $supplier->update($validated);

        return redirect()->route('suppliers.index')->with('success', 'Fournisseur mis à jour avec succès.');
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();
        return redirect()->route('suppliers.index')->with('success', 'Fournisseur supprimé avec succès.');
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'uuids'   => 'required|array',
            'uuids.*' => 'exists:suppliers,uuid',
        ]);
        $deleted = Supplier::whereIn('uuid', $validated['uuids'])->delete();
        return redirect()->route('suppliers.index')->with('success', $deleted . ' fournisseur(s) supprimé(s).');
    }

    public function exportCsv(): StreamedResponse
    {
        $headers = [
            'Content-type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename=suppliers.csv',
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate',
            'Expires'             => '0',
        ];
        $callback = function () {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Name', 'Email', 'Phone', 'City', 'Status']);
            Supplier::chunk(500, function ($suppliers) use ($file) {
                foreach ($suppliers as $s) {
                    fputcsv($file, [$s->nom, $s->email, $s->telephone, $s->ville, $s->status]);
                }
            });
            fclose($file);
        };
        return response()->stream($callback, 200, $headers);
    }
}
