<?php

namespace App\Http\Controllers;

use App\Models\Charge;
use App\Models\ChargeCategory;
use App\Models\CompanyProfile;
use App\Models\Employee;
use App\Models\EmployeePayment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChargeController extends Controller
{
    public function index(Request $request)
    {
        // Dynamic categories from DB (with fallback seed if empty)
        $categories = ChargeCategory::orderBy('sort_order')->orderBy('nom')->get()
            ->map(fn ($c) => [
                'value'     => $c->slug,
                'label'     => $c->nom,
                'color'     => $c->color,
                'bg_color'  => $c->bg_color,
                'icon_name' => $c->icon_name,
                'is_default'=> $c->is_default,
            ]);

        // Valid slugs for filtering
        $validSlugs = $categories->pluck('value')->toArray();

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
            'readonly'       => false,
        ])->toArray();

        // Merge employee salary payments as read-only rows
        $epQuery = EmployeePayment::with('employee')->whereNotNull('paid_at');

        if ($request->search) {
            $epQuery->whereHas('employee', fn ($q) => $q->where('nom', 'like', '%' . $request->search . '%'));
        }
        if ($request->category && $request->category !== 'all' && $request->category !== 'salaire_employe') {
            // If filtering by a non-salary category, skip employee payments
            $epQuery->whereNull('id'); // empty result
        }

        $salaryRows = $epQuery->get()->map(fn ($ep) => [
            'uuid'           => 'ep_' . $ep->id,
            'category'       => 'salaire_employe',
            'description'    => ($ep->employee->nom ?? 'Employé') . ' · Salaire ' .
                                \Carbon\Carbon::create($ep->year, $ep->month)->locale('fr')->isoFormat('MMMM YYYY'),
            'amount'         => (float) $ep->amount,
            'date'           => $ep->paid_at->format('Y-m-d'),
            'date_display'   => $ep->paid_at->format('d M. Y'),
            'recurrence'     => 'mensuelle',
            'payment_method' => null,
            'status'         => 'paye',
            'notes'          => null,
            'readonly'       => true,
        ])->toArray();

        // Merge and sort by date desc
        $allRows = collect(array_merge($charges, $salaryRows))
            ->sortByDesc('date')
            ->values()
            ->toArray();

        $now   = now();
        $month = $now->month;
        $year  = $now->year;

        $chargesMonthTotal = (float) Charge::whereMonth('date', $month)->whereYear('date', $year)->sum('amount');
        $salairesMonthTotal = (float) EmployeePayment::where('month', $month)->where('year', $year)
            ->whereNotNull('paid_at')->sum('amount');

        $stats = [
            'total_mois'     => round($chargesMonthTotal + $salairesMonthTotal, 2),
            'loyer_mois'     => round((float) Charge::whereMonth('date', $month)->whereYear('date', $year)->where('category', 'loyer')->sum('amount'), 2),
            'salaires_mois'  => round(
                (float) Charge::whereMonth('date', $month)->whereYear('date', $year)->where('category', 'salaires')->sum('amount')
                + $salairesMonthTotal, 2
            ),
            'a_payer'        => round((float) Charge::where('status', 'a_payer')->sum('amount'), 2),
            'a_payer_count'  => Charge::where('status', 'a_payer')->count(),
        ];

        $employees = Employee::where('status', 'actif')->orderBy('nom')->get()
            ->map(fn ($e) => [
                'uuid'         => $e->uuid,
                'nom'          => $e->nom,
                'salaire_brut' => (float) $e->salaire_brut,
            ]);

        return Inertia::render('charges/Index', [
            'charges'    => $allRows,
            'categories' => $categories,
            'employees'  => $employees,
            'stats'      => $stats,
            'filters'    => [
                'search'   => $request->search   ?? '',
                'category' => $request->category ?? 'all',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validSlugs = ChargeCategory::pluck('slug')->toArray();

        $validated = $request->validate([
            'category'       => 'required|in:' . implode(',', $validSlugs),
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
        $validSlugs = ChargeCategory::pluck('slug')->toArray();

        $validated = $request->validate([
            'category'       => 'required|in:' . implode(',', $validSlugs),
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

        $categoryLabels = ChargeCategory::pluck('nom', 'slug')->toArray();
        $categoryLabels['salaire_employe'] = 'Salaire employé';

        $pdf = Pdf::loadView('charges.export_pdf', compact('charges', 'total', 'company', 'categoryLabels'))
            ->setPaper('a4', 'portrait');

        $date = now()->format('Y-m-d');
        return $pdf->download("charges-{$date}.pdf");
    }
}
