<?php
namespace App\Http\Controllers;

use App\Models\Fournisseur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FournisseurController extends Controller
{
    public function index(Request $request)
    {
        $query = Fournisseur::query();

        if ($search = $request->input('search')) {
            $query->where('nom', 'like', "%{$search}%")
                ->orWhere('adresse', 'like', "%{$search}%")
                ->orWhere('telephone', 'like', "%{$search}%");
        }

        $fournisseurs = $query->latest()->paginate(10)->withQueryString();

        return view('fournisseurs.index', compact('fournisseurs', 'search'));
    }


    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:255',
            'adresse' => 'nullable|string',
            'telephone' => 'nullable|string',
            'image' => 'nullable|mimes:jpg,jpeg,png,webp,gif,svg,bmp,avif|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = preg_replace('/[^A-Za-z0-9\-]/', '', $data['nom']) . '.' . $file->getClientOriginalExtension();
            $data['image'] = $file->storeAs('fournisseurs', $filename, 'public');
        }

        Fournisseur::create($data);

        return redirect()->route('fournisseurs.index')->with('success', 'Fournisseur ajouté');
    }

    public function update(Request $request, Fournisseur $fournisseur)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:255',
            'adresse' => 'nullable|string',
            'telephone' => 'nullable|string',
            'image' => 'nullable|mimes:jpg,jpeg,png,webp,gif,svg,bmp,avif|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($fournisseur->image && Storage::disk('public')->exists($fournisseur->image)) {
                Storage::disk('public')->delete($fournisseur->image);
            }

            $file = $request->file('image');

            $filename =
                preg_replace('/[^A-Za-z0-9\-]/', '_', strtolower($data['nom']))
                . '.' . $file->getClientOriginalExtension();

            $data['image'] = $file->storeAs('fournisseurs', $filename, 'public');
        }

        $fournisseur->update($data);

        return redirect()->route('fournisseurs.index')->with('success', 'Fournisseur modifié');
    }


    public function destroy(Fournisseur $fournisseur)
    {
        if ($fournisseur->image && Storage::disk('public')->exists($fournisseur->image)) {
            Storage::disk('public')->delete($fournisseur->image);
        }

        $fournisseur->delete();
        return back()->with('success', 'Fournisseur supprimé');
    }
}
