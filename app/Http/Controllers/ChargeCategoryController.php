<?php

namespace App\Http\Controllers;

use App\Models\ChargeCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ChargeCategoryController extends Controller
{
    public function index()
    {
        return Inertia::render('parametres/Categories', [
            'categories' => ChargeCategory::orderBy('sort_order')->orderBy('nom')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'        => 'required|string|max:100',
            'color'      => 'nullable|string|max:60',
            'bg_color'   => 'nullable|string|max:80',
            'icon_name'  => 'nullable|string|max:50',
            'is_default' => 'nullable|boolean',
        ]);

        $slug = Str::slug($validated['nom'], '_');
        if (ChargeCategory::where('slug', $slug)->exists()) {
            $slug .= '_' . Str::random(4);
        }

        ChargeCategory::create(array_merge($validated, [
            'slug'       => $slug,
            'sort_order' => ChargeCategory::max('sort_order') + 1,
            'is_default' => $request->boolean('is_default'),
        ]));

        return back()->with('success', 'Catégorie créée.');
    }

    public function update(Request $request, ChargeCategory $chargeCategory)
    {
        $validated = $request->validate([
            'nom'        => 'required|string|max:100',
            'color'      => 'nullable|string|max:60',
            'bg_color'   => 'nullable|string|max:80',
            'icon_name'  => 'nullable|string|max:50',
            'is_default' => 'nullable|boolean',
        ]);

        $chargeCategory->update(array_merge($validated, [
            'is_default' => $request->boolean('is_default'),
        ]));

        return back()->with('success', 'Catégorie mise à jour.');
    }

    public function destroy(ChargeCategory $chargeCategory)
    {
        if ($chargeCategory->is_default) {
            return back()->withErrors(['error' => 'Impossible de supprimer une catégorie par défaut.']);
        }

        $chargeCategory->delete();

        return back()->with('success', 'Catégorie supprimée.');
    }
}
