<?php

namespace App\Http\Controllers;

use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProduitController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {

        /*
        |--------------------------------------------------------------------------
        | GLOBAL STATS (NO FILTERS)
        |--------------------------------------------------------------------------
        */

        $totalProduits = Produit::count();

        $totalStock = Produit::sum('stock_quantity');

        $lowStock = Produit::whereColumn('stock_quantity', '<=', 'stock_alert_threshold')
            ->where('stock_quantity', '>', 0)->count();

        $outOfStock = Produit::where('stock_quantity', 0)->count();

         /*
        |--------------------------------------------------------------------------
        | FILTERED / PAGINATED LIST
        |--------------------------------------------------------------------------
        */
        $produits = Produit::query()

            // 🔎 Search (nom + sku)
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })

            // 📦 Stock filter
            ->when($request->stock, function ($query, $stock) {
                if ($stock === 'in_stock') {
                    $query->whereColumn('stock_quantity', '>', 'stock_alert_threshold');
                }
                if ($stock === 'low_stock') {
                    $query->whereColumn('stock_quantity', '<=', 'stock_alert_threshold')
                          ->where('stock_quantity', '>', 0);
                }
                if ($stock === 'out_of_stock') {
                    $query->where('stock_quantity', 0);
                }
            })

            // 🔃 Sorting
            ->when($request->sort, function ($query, $sort) {

                $allowedSorts = [
                    'name' => 'nom',
                    'purchase' => 'purchase_price',
                    'sale' => 'sale_price',
                    'stock' => 'stock_quantity',
                ];

                if (str_contains($sort, '_')) {
                    [$field, $direction] = explode('_', $sort);

                    if (isset($allowedSorts[$field]) && in_array($direction, ['asc', 'desc'])) {
                        $query->orderBy($allowedSorts[$field], $direction);

                        return;
                    }
                }

                // fallback
                $query->orderBy('created_at', 'desc');

            }, function ($query) {
                $query->orderBy('created_at', 'desc');
            })

            ->paginate($request->per_page ?? 5)
            ->withQueryString();

        return Inertia::render('produits/Index', [
            'produits' => $produits,

            'globalStats' => [
                'totalProduits' => $totalProduits,
                'totalStock' => $totalStock,
                'lowStock' => $lowStock,
                'outOfStock' => $outOfStock,
            ],

            'filters' => [
                'search' => $request->search ?? '',
                'stock' => $request->stock ?? 'all',
                'sort' => $request->sort ?? '',
                'per_page' => $request->per_page ?? '5',
            ],
        ]);
    }

    /**
     * Show create form
     */
    public function create()
    {
        return Inertia::render('produits/Create');
    }

    /**
     * Store new product
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'                   => 'required|string|max:255',
            'image'                 => 'nullable|image',
            'description'           => 'nullable|string',
            'purchase_price'        => 'required|numeric|min:0',
            'sale_price'            => 'required|numeric|min:0',
            'stock_quantity'        => 'required|integer|min:0',
            'stock_alert_threshold' => 'nullable|integer|min:0',
        ]);

        $validated['stock_alert_threshold'] = $validated['stock_alert_threshold'] ?? 10;

        // Handle image upload
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('produits', 'public');
        }

        Produit::create($validated);

        return redirect()
            ->route('produits.index')
            ->with('success', 'Produit créé avec succès.');
    }

    /**
     * Show product details
     */
    public function show(Produit $produit)
    {
        return Inertia::render('produits/Show', [
            'produit' => $produit,
        ]);
    }

    /**
     * Show edit form
     */
    public function edit(Produit $produit)
    {
        return Inertia::render('produits/Edit', [
            'produit' => $produit,
        ]);
    }

    /**
     * Update product
     */
    public function update(Request $request, Produit $produit)
    {
        $validated = $request->validate([
            'nom'                   => 'required|string|max:255',
            'image'                 => 'nullable|image',
            'description'           => 'nullable|string',
            'purchase_price'        => 'required|numeric|min:0',
            'sale_price'            => 'required|numeric|min:0',
            'stock_quantity'        => 'required|integer|min:0',
            'stock_alert_threshold' => 'nullable|integer|min:0',
        ]);

        if (!isset($validated['stock_alert_threshold'])) {
            $validated['stock_alert_threshold'] = 10;
        }

        // Handle image logic
        if ($request->hasFile('image')) {
            // User uploaded a new image → replace old
            if ($produit->image) {
                Storage::disk('public')->delete($produit->image);
            }
            $validated['image'] = $request->file('image')->store('produits', 'public');
        } elseif ($request->input('image') === null && $request->has('image')) {
            // User wants to remove the image → delete old and set to null
            if ($produit->image) {
                Storage::disk('public')->delete($produit->image);
            }
            $validated['image'] = null;
        } else {
            // User did nothing with image → keep old
            unset($validated['image']);
        }

        $produit->update($validated);

        return redirect()
            ->route('produits.index')
            ->with('success', 'Produit mis à jour avec succès.');
    }

    /**
     * Delete product
     */
    public function destroy(Produit $produit)
    {
        if ($produit->image) {
            Storage::disk('public')->delete($produit->image);
        }

        $produit->delete();

        return redirect()
            ->route('produits.index')
            ->with('success', 'Produit supprimé avec succès.');
    }

    public function bulkDelete(Request $request)
    {
        $uuids = $request->input('uuids', []);

        $produits = Produit::whereIn('uuid', $uuids)->get();

        foreach ($produits as $produit) {
            if ($produit->image) {
                Storage::disk('public')->delete($produit->image);
            }
            $produit->delete();
        }

        return redirect()->route('produits.index')->with('success', count($uuids).' produit(s) supprimé(s) avec succès.');
    }
}
