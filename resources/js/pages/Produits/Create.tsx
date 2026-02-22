import { Head, Link, useForm } from "@inertiajs/react";
import { route } from "ziggy-js";

export default function Create() {
    const { data, setData, post } = useForm({
        nom: "",
        description: "",
        prix_achat: "",
        prix_vente: "",
        quantite: "",
        image: "" as unknown as File | null,
    });

    function submit(e: { preventDefault: () => void; }) {
        e.preventDefault();
        post(route("produits.store"));
    }

    return (
        <>
            <Head title="Ajouter Produit" />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Ajouter Produit</h1>

                <form onSubmit={submit} className="space-y-4">
                    <input type="text" placeholder="Nom" value={data.nom} onChange={e => setData("nom", e.target.value)} className="w-full border px-3 py-2 rounded"/>
                    <textarea placeholder="Description" value={data.description} onChange={e => setData("description", e.target.value)} className="w-full border px-3 py-2 rounded"/>
                    <input type="number" placeholder="Prix Achat" value={data.prix_achat} onChange={e => setData("prix_achat", e.target.value)} className="w-full border px-3 py-2 rounded"/>
                    <input type="number" placeholder="Prix Vente" value={data.prix_vente} onChange={e => setData("prix_vente", e.target.value)} className="w-full border px-3 py-2 rounded"/>
                    <input type="number" placeholder="Quantité" value={data.quantite} onChange={e => setData("quantite", e.target.value)} className="w-full border px-3 py-2 rounded"/>
                    <input type="file" onChange={e => setData("image", e.target.files?.[0] || null)} />
                    <button className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
                    <Link href={route("produits.index")} className="block text-center text-gray-500 mt-2">Back</Link>
                </form>
            </div>
        </>
    )
}