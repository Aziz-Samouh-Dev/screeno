<?php
namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Client::query();

        if ($search = $request->input('search')) {
            $query->where('nom', 'like', "%{$search}%")
                ->orWhere('adresse', 'like', "%{$search}%")
                ->orWhere('telephone', 'like', "%{$search}%");
        }

        $clients = $query->latest()->paginate(10)->withQueryString();

        return view('clients.index', compact('clients', 'search'));
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
            $filename = preg_replace('/[^A-Za-z0-9\-]/', '_', strtolower($data['nom']))
                        . '.' . $file->getClientOriginalExtension();
            $data['image'] = $file->storeAs('clients', $filename, 'public');
        }

        Client::create($data);

        return redirect()->route('clients.index')->with('success', 'Client ajouté');
    }

    public function update(Request $request, Client $client)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:255',
            'adresse' => 'nullable|string',
            'telephone' => 'nullable|string',
            'image' => 'nullable|mimes:jpg,jpeg,png,webp,gif,svg,bmp,avif|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($client->image && Storage::disk('public')->exists($client->image)) {
                Storage::disk('public')->delete($client->image);
            }

            $file = $request->file('image');
            $filename = preg_replace('/[^A-Za-z0-9\-]/', '_', strtolower($data['nom']))
                        . '.' . $file->getClientOriginalExtension();
            $data['image'] = $file->storeAs('clients', $filename, 'public');
        }

        $client->update($data);

        return redirect()->route('clients.index')->with('success', 'Client modifié');
    }

    public function destroy(Client $client)
    {
        if ($client->image && Storage::disk('public')->exists($client->image)) {
            Storage::disk('public')->delete($client->image);
        }

        $client->delete();
        return back()->with('success', 'Client supprimé');
    }
}
