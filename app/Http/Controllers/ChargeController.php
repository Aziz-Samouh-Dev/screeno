<?php

namespace App\Http\Controllers;

use App\Models\Charge;
use App\Models\CompanyProfile;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChargeController extends Controller
{
    public function index(Request $request)
    {
        $query = Charge::query();

        if ($request->search) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }
        if ($request->category && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        $charges = $query->orderBy('date', 'desc')->get()->map(fn ($c) => [
            'uuid'           => $c->uuid,
            'category'       => $c->category,
            'description'    => $c->description,
            'amount'         => (float) $c->amount,
            'date'           => $c->date->format('Y-m-d'),
            'date_display'   => $c->date->format('d M. Y'),
            'recurrence'     => $c->recurrence,
            'payment_method' => $c->payment_method,
            'status'         => $c->status,
            'notes'          => $c->notes,
        ]);

        $now   = now();
        $month = $now->month;
        $year  = $now->year;

        $stats = [
            'total_mois'     => round((float) Charge::whereMonth('date', $month)->whereYear('date', $year)->sum('amount'), 2),
            'loyer_mois'     => round((float) Charge::whereMonth('date', $month)->whereYear('date', $year)->where('category', 'loyer')->sum('amount'), 2),
            'salaires_mois'  => round((float) Charge::whereMonth('date', $month)->whereYear('date', $year)->where('category', 'salaires')->sum('amount'), 2),
            'a_payer'        => round((float) Charge::where('status', 'a_payer')->sum('amount'), 2),
            'a_payer_count'  => Charge::where('status', 'a_payer')->count(),
        ];

        return Inertia::render('charges/Index', [
            'charges' => $charges,
            'stats'   => $stats,
            'filters' => [
                'search'   => $request->search   ?? '',
                'category' => $request->category ?? 'all',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category'       => 'required|in:loyer,salaires,energie,transport,taxes,assurance,telecom,autre',
            'description'    => 'required|string|max:255',
            'amount'         => 'required|numeric|min:0',
            'date'           => 'required|date',
            'recurrence'     => 'required|in:ponctuelle,mensuelle,trimestrielle,annuelle',
            'payment_method' => 'nullable|string|max:100',
            'status'         => 'required|in:paye,a_payer',
            'notes'          => 'nullable|string',
        ]);

        Charge::create($validated);

        return back()->with('success', 'Charge ajoutée avec succès.');
    }

    public function update(Request $request, Charge $charge)
    {
        $validated = $request->validate([
            'category'       => 'required|in:loyer,salaires,energie,transport,taxes,assurance,telecom,autre',
            'description'    => 'required|string|max:255',
            'amount'         => 'required|numeric|min:0',
            'date'           => 'required|date',
            'recurrence'     => 'required|in:ponctuelle,mensuelle,trimestrielle,annuelle',
            'payment_method' => 'nullable|string|max:100',
            'status'         => 'required|in:paye,a_payer',
            'notes'          => 'nullable|string',
        ]);

        $charge->update($validated);

        return back()->with('success', 'Charge mise à jour.');
    }

    public function destroy(Charge $charge)
    {
        $charge->delete();

        return back()->with('success', 'Charge supprimée.');
    }

    public function exportPdf(Request $request)
    {
        $query = Charge::query();
        if ($request->category && $request->category !== 'all') {
            $query->where('category', $request->category);
        }
        if ($request->date_from) $query->whereDate('date', '>=', $request->date_from);
        if ($request->date_to)   $query->whereDate('date', '<=', $request->date_to);

        $charges = $query->orderBy('date', 'desc')->get();
        $total   = $charges->sum('amount');
        $company = (CompanyProfile::first() ?? new CompanyProfile())->toArray();

        $categoryLabels = [
            'loyer' => 'Loyer', 'salaires' => 'Salaires', 'energie' => 'Énergie',
            'transport' => 'Transport', 'taxes' => 'Taxes', 'assurance' => 'Assurance',
            'telecom' => 'Télécom', 'autre' => 'Autre',
        ];

        $pdf = Pdf::loadView('charges.export_pdf', compact('charges', 'total', 'company', 'categoryLabels'))
            ->setPaper('a4', 'portrait');

        $date = now()->format('Y-m-d');
        return $pdf->download("charges-{$date}.pdf");
    }
}
