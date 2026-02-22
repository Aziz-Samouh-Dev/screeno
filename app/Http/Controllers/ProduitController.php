<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProduitController extends Controller
{
    public function index(Request $request)
    {
        $query = Produit::query();

        if ($search = $request->input('search')) {
            $query->where('nom', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
        }

        $produits = $query->latest()->paginate(5)->withQueryString();

        return Inertia::render('Produits/Index', [
            'produits' => $produits,
            'filters' => ['search' => $search],
        ]);
    }

    public function create()
    {
        return Inertia::render('Produits/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'prix_achat' => 'nullable|numeric',
            'prix_vente' => 'nullable|numeric',
            'quantite' => 'nullable|integer',
            'image' => 'nullable|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('produits', 'public');
        }

        Produit::create($data);

        return redirect()->route('produits.index');
    }

    public function show(Produit $produit)
    {
        return Inertia::render('Produits/Show', [
            'produit' => $produit
        ]);
    }

    public function edit(Produit $produit)
    {
        return Inertia::render('Produits/Edit', [
            'produit' => $produit
        ]);
    }

    public function update(Request $request, Produit $produit)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'prix_achat' => 'nullable|numeric',
            'prix_vente' => 'nullable|numeric',
            'quantite' => 'nullable|integer',
            'image' => 'nullable|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($produit->image && Storage::disk('public')->exists($produit->image)) {
                Storage::disk('public')->delete($produit->image);
            }
            $data['image'] = $request->file('image')->store('produits', 'public');
        }

        $produit->update($data);

        return redirect()->route('produits.index');
    }

    public function destroy(Produit $produit)
    {
        if ($produit->image && Storage::disk('public')->exists($produit->image)) {
            Storage::disk('public')->delete($produit->image);
        }

        $produit->delete();
        return back();
    }
}