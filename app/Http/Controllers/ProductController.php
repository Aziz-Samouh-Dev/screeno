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

        $produits = $query->latest()->paginate(2)->withQueryString();

        return Inertia::render('Produits/Index', [
            'produits' => $produits,
        ]);

    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'prix_achat' => 'nullable|numeric',
            'prix_vente' => 'nullable|numeric',
            'quantite' => 'nullable|integer',
            'image' => 'nullable|mimes:jpg,jpeg,png,webp,gif,svg,bmp,avif|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = preg_replace('/[^A-Za-z0-9\-]/', '', $data['nom']) . '.' . $file->getClientOriginalExtension();
            $data['image'] = $file->storeAs('produits', $filename, 'public');
        }

        Produit::create($data);

        return redirect()->route('produits.index')->with('success', 'Produit ajouté');
    }

    public function update(Request $request, Produit $produit)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'prix_achat' => 'nullable|numeric',
            'prix_vente' => 'nullable|numeric',
            'quantite' => 'nullable|integer',
            'image' => 'nullable|mimes:jpg,jpeg,png,webp,gif,svg,bmp,avif|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($produit->image && Storage::disk('public')->exists($produit->image)) {
                Storage::disk('public')->delete($produit->image);
            }

            $file = $request->file('image');
            $filename = preg_replace('/[^A-Za-z0-9\-]/', '_', strtolower($data['nom'])) . '.' . $file->getClientOriginalExtension();
            $data['image'] = $file->storeAs('produits', $filename, 'public');
        }

        $produit->update($data);

        return redirect()->route('produits.index')->with('success', 'Produit modifié');
    }

    public function destroy(Produit $produit)
    {
        if ($produit->image && Storage::disk('public')->exists($produit->image)) {
            Storage::disk('public')->delete($produit->image);
        }

        $produit->delete();
        return back()->with('success', 'Produit supprimé');
    }
}
