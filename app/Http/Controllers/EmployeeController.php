<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeePayment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index()
    {
        $now   = now();
        $month = (int) $now->month;
        $year  = (int) $now->year;

        $employees = Employee::with(['payments' => fn ($q) => $q->where('month', $month)->where('year', $year)])
            ->orderBy('nom')
            ->get()
            ->map(function (Employee $emp) {
                $payment = $emp->payments->first();
                return [
                    'uuid'          => $emp->uuid,
                    'nom'           => $emp->nom,
                    'email'         => $emp->email,
                    'telephone'     => $emp->telephone,
                    'poste'         => $emp->poste,
                    'salaire_brut'  => (float) $emp->salaire_brut,
                    'date_embauche' => $emp->date_embauche->format('d M. Y'),
                    'cnss'          => $emp->cnss,
                    'status'        => $emp->status,
                    'paie_status'   => $payment
                        ? 'paye'
                        : ($emp->status === 'actif' ? 'en_attente' : 'inactif'),
                ];
            });

        $active = $employees->where('status', 'actif');

        $stats = [
            'effectif_actif'  => $active->count(),
            'inactif_count'   => $employees->where('status', 'inactif')->count(),
            'masse_salariale' => round($active->sum('salaire_brut'), 2),
            'payes_ce_mois'   => $employees->where('paie_status', 'paye')->count(),
            'total_employes'  => $employees->count(),
            'en_attente'      => $employees->where('paie_status', 'en_attente')->count(),
        ];

        return Inertia::render('employees/Index', [
            'employees'    => $employees->values(),
            'stats'        => $stats,
            'currentMonth' => ucfirst($now->locale('fr')->isoFormat('MMMM YYYY')),
        ]);
    }

    public function create()
    {
        return Inertia::render('employees/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'           => 'required|string|max:255',
            'email'         => 'nullable|email|unique:employees,email',
            'telephone'     => 'nullable|string|max:20',
            'poste'         => 'required|string|max:100',
            'salaire_brut'  => 'required|numeric|min:0',
            'date_embauche' => 'required|date',
            'cnss'          => 'nullable|string|max:50',
            'status'        => 'in:actif,inactif',
        ]);

        Employee::create($validated);

        return redirect()->route('employees.index')->with('success', 'Employé ajouté avec succès.');
    }

    public function edit(Employee $employee)
    {
        return Inertia::render('employees/Edit', ['employee' => $employee]);
    }

    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'nom'           => 'required|string|max:255',
            'email'         => 'nullable|email|unique:employees,email,' . $employee->id,
            'telephone'     => 'nullable|string|max:20',
            'poste'         => 'required|string|max:100',
            'salaire_brut'  => 'required|numeric|min:0',
            'date_embauche' => 'required|date',
            'cnss'          => 'nullable|string|max:50',
            'status'        => 'in:actif,inactif',
        ]);

        $employee->update($validated);

        return redirect()->route('employees.index')->with('success', 'Employé mis à jour.');
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();

        return back()->with('success', 'Employé supprimé.');
    }

    public function pay(Employee $employee)
    {
        $now = now();
        EmployeePayment::firstOrCreate(
            ['employee_id' => $employee->id, 'month' => $now->month, 'year' => $now->year],
            ['amount' => $employee->salaire_brut, 'paid_at' => $now]
        );

        return back()->with('success', "Salaire de {$employee->nom} marqué comme payé.");
    }

    public function payAll()
    {
        $now     = now();
        $paid    = 0;
        $actives = Employee::where('status', 'actif')->get();

        foreach ($actives as $emp) {
            $result = EmployeePayment::firstOrCreate(
                ['employee_id' => $emp->id, 'month' => $now->month, 'year' => $now->year],
                ['amount' => $emp->salaire_brut, 'paid_at' => $now]
            );
            if ($result->wasRecentlyCreated) $paid++;
        }

        return back()->with('success', $paid > 0
            ? "{$paid} salaire(s) marqué(s) comme payés."
            : 'Tous les salaires ont déjà été payés ce mois.');
    }
}
