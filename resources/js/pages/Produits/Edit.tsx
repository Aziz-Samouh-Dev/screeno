import { Head, Link, useForm } from "@inertiajs/react";
import { route } from "ziggy-js";

export default function Edit({ produit }: { produit: { id: number; nom: string; description: string; prix_achat: number; prix_vente: number; quantite: number } }) {
    const { data, setData, put } = useForm<{
        nom: string;
        description: string;
        prix_achat: number;
        prix_vente: number;
        quantite: number;
        image: File | null;
    }>({
        nom: produit.nom,
        description: produit.description,
        prix_achat: produit.prix_achat,
        prix_vente: produit.prix_vente,
        quantite: produit.quantite,
        image: null,
    });

    function submit(e: { preventDefault: () => void; }) {
        e.preventDefault();
        put(route("produits.update", produit.id));
    }

    return (
        <>
            <Head title="Edit Produit" />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Edit Produit</h1>

                <form onSubmit={submit} className="space-y-4">
                    <input type="text" value={data.nom} onChange={e => setData("nom", e.target.value)} className="w-full border px-3 py-2 rounded"/>
                    <textarea value={data.description} onChange={e => setData("description", e.target.value)} className="w-full border px-3 py-2 rounded"/>
                    <input type="number" value={data.prix_achat} onChange={e => setData("prix_achat", Number(e.target.value))} className="w-full border px-3 py-2 rounded"/>
                    <input type="number" value={data.prix_vente} onChange={e => setData("prix_vente", Number(e.target.value))} className="w-full border px-3 py-2 rounded"/>
                    <input type="number" value={data.quantite} onChange={e => setData("quantite", Number(e.target.value))} className="w-full border px-3 py-2 rounded"/>
                    <input type="file" onChange={e => setData("image", e.target.files?.[0] ?? null)} />
                    <button className="bg-yellow-600 text-white px-4 py-2 rounded">Update</button>
                    <Link href={route("produits.index")} className="block text-center text-gray-500 mt-2">Back</Link>
                </form>
            </div>
        </>
    )
}