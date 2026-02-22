import { Head, Link } from "@inertiajs/react";
import {route} from "ziggy-js";

export default function Show({ produit }: { produit: any }) {
    return (
        <>
            <Head title={produit.nom} />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold">{produit.nom}</h1>
                {produit.image && <img src={`/storage/${produit.image}`} className="my-4 max-h-80 rounded object-cover" />}
                <p>{produit.description}</p>
                <p>Stock: {produit.quantite}</p>
                <p>Prix Vente: {produit.prix_vente}</p>
                <p>Prix Achat: {produit.prix_achat}</p>

                <Link href={route("produits.index")} className="text-blue-600 mt-4 block">Back to list</Link>
            </div>
        </>
    )
}