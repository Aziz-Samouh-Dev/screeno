<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $totalClients    = Client::count();
        $activeClients   = Client::where('status', 'active')->count();
        $inactiveClients = Client::where('status', 'inactive')->count();

        $clients = Client::query()
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('telephone', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                if ($status !== 'all') {
                    $query->where('status', $status);
                }
            })
            ->when($request->sort, function ($query, $sort) {
                $allowedSorts = ['name' => 'nom', 'email' => 'email', 'city' => 'ville', 'status' => 'status'];
                if (str_contains($sort, '_')) {
                    [$field, $direction] = explode('_', $sort);
                    if (isset($allowedSorts[$field]) && in_array($direction, ['asc', 'desc'])) {
                        $query->orderBy($allowedSorts[$field], $direction);
                        return;
                    }
                }
                $query->orderBy('created_at', 'desc');
            }, function ($query) {
                $query->orderBy('created_at', 'desc');
            })
            ->paginate($request->per_page ?? 5)
            ->withQueryString();

        return Inertia::render('clients/Index', [
            'clients'     => $clients,
            'globalStats' => [
                'totalClients'    => $totalClients,
                'activeClients'   => $activeClients,
                'inactiveClients' => $inactiveClients,
            ],
            'filters' => [
                'search'   => $request->search   ?? '',
                'status'   => $request->status   ?? 'all',
                'sort'     => $request->sort     ?? '',
                'per_page' => $request->per_page ?? '5',
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('clients/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'       => 'required|string|max:255',
            'email'     => 'required|email|unique:clients,email',
            'telephone' => 'required|string|max:20',
            'adresse'   => 'nullable|string',
            'ville'     => 'nullable|string|max:255',
            'pays'      => 'nullable|string|max:255',
            'notes'     => 'nullable|string',
            'status'    => 'required|in:active,inactive',
        ]);

        Client::create($validated);

        return redirect()->route('clients.index')->with('success', 'Client créé avec succès.');
    }

    public function show(Client $client)
    {
        $transactions = ClientTransaction::where('client_id', $client->id)
            ->orderBy('created_at', 'asc')
            ->get();

        $rt   = 0.0;
        $rows = $transactions->map(function ($t) use (&$rt) {
            $rt += $t->type === 'F' ? (float) $t->total_price : -(float) $t->total_price;
            return [
                'uuid'          => $t->uuid,
                'type'          => $t->type,
                'product_name'  => $t->product_name,
                'quantity'      => $t->quantity,
                'unit_price'    => (float) $t->unit_price,
                'total_price'   => (float) $t->total_price,
                'running_total' => round($rt, 2),
                'notes'         => $t->notes,
                'created_at'    => $t->created_at->toIso8601String(),
            ];
        })->reverse()->values();

        return Inertia::render('clients/Show', [
            'client'       => $client->only(['uuid', 'nom', 'email', 'telephone', 'adresse', 'ville', 'notes', 'status', 'created_at', 'updated_at']),
            'transactions' => $rows,
            'balance'      => round($rt, 2),
        ]);
    }

    public function edit(Client $client)
    {
        return Inertia::render('clients/Edit', ['client' => $client]);
    }

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'nom'       => 'required|string|max:255',
            'email'     => 'required|email|unique:clients,email,'.$client->id,
            'telephone' => 'nullable|regex:/^[0-9+\-\s]+$/',
            'adresse'   => 'nullable|string',
            'ville'     => 'nullable|string',
            'pays'      => 'nullable|string',
            'notes'     => 'nullable|string',
            'status'    => 'required|in:active,inactive',
        ]);

        $client->update($validated);

        return redirect()->route('clients.index')->with('success', 'Client mis à jour avec succès.');
    }

    public function destroy(Client $client)
    {
        $client->delete();

        return redirect()->route('clients.index')->with('success', 'Client supprimé avec succès.');
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'uuids'   => 'required|array',
            'uuids.*' => 'exists:clients,uuid',
        ]);

        $deleted = Client::whereIn('uuid', $validated['uuids'])->delete();

        return redirect()->route('clients.index')->with('success', $deleted.' client(s) supprimé(s) avec succès.');
    }

    public function exportCsv(): StreamedResponse
    {
        $headers = [
            'Content-type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename=clients.csv',
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate',
            'Expires'             => '0',
        ];

        $columns  = ['Name', 'Email', 'Phone', 'City', 'Country', 'Status'];
        $callback = function () use ($columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            Client::chunk(500, function ($clients) use ($file) {
                foreach ($clients as $client) {
                    fputcsv($file, [$client->nom, $client->email, $client->telephone, $client->ville, $client->pays, $client->status]);
                }
            });
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
