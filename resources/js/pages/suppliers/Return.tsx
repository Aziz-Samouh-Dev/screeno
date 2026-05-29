import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
    ArrowLeft, RotateCcw, Plus, Trash2, Info, AlertTriangle, RefreshCw, DollarSign, XCircle,
} from 'lucide-react';

interface Supplier { uuid: string; nom: string; telephone: string; }
interface ReturnableProduct {
    product_id: number; product_name: string;
    total_purchased: number; total_returned: number;
    available: number; stock_quantity: number; unit_price: number;
}

const returnTypes = [
    { value: 'change', label: 'Échange', desc: 'Retour produit endommagé → le fournisseur donne un neuf', icon: RefreshCw, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200' },
    { value: 'refund', label: 'Remboursement', desc: 'Retour → le fournisseur rembourse', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200' },
    { value: 'loss', label: 'Perte', desc: 'Produit trop abîmé, fournisseur refuse, on perd l\'argent', icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200' },
];

export default function ReturnForm() {
    const { supplier, returnableProducts } = usePage().props as unknown as { supplier: Supplier; returnableProducts: ReturnableProduct[] };
    const [items, setItems] = useState([{ product_id: '', quantity: 1, return_type: 'change' }]);
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Fournisseurs', href: '/suppliers' },
        { title: supplier.nom, href: `/suppliers/${supplier.uuid}` },
        { title: 'Retour', href: `/suppliers/${supplier.uuid}/return` },
    ];

    const addItem = () => setItems([...items, { product_id: '', quantity: 1, return_type: 'change' }]);
    const removeItem = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));

    const updateItem = (i: number, field: string, value: any) => {
        const updated = [...items];
        updated[i] = { ...updated[i], [field]: value };
        if (field === 'product_id') {
            const p = returnableProducts.find(rp => String(rp.product_id) === value);
            if (p && updated[i].quantity > p.available) updated[i].quantity = p.available;
        }
        setItems(updated);
    };

    const getProduct = (id: string) => returnableProducts.find(rp => String(rp.product_id) === id);

    const handleSubmit = () => {
        const payload = items.map(it => ({
            product_id: Number(it.product_id),
            quantity: Number(it.quantity),
            return_type: it.return_type,
        }));

        if (payload.some(it => !it.product_id || it.quantity < 1)) {
            toast.error('Veuillez remplir tous les champs.');
            return;
        }

        setProcessing(true);
        router.post(`/suppliers/${supplier.uuid}/return`, { items: payload, notes }, {
            onFinish: () => setProcessing(false),
            onError: (e) => {
                const msg = Object.values(e)[0] || 'Erreur lors du retour.';
                toast.error(msg);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Retour — ${supplier.nom}`} />
            <div className="flex flex-col gap-6 p-6 max-w-4xl">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Retour à {supplier.nom}</h1>
                        <p className="text-sm text-muted-foreground">Retourner des produits au fournisseur</p>
                    </div>
                </div>

                {/* Supplier info */}
                <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                        <RotateCcw className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-foreground text-sm">{supplier.nom}</p>
                        <p className="text-xs text-muted-foreground">{supplier.telephone}</p>
                    </div>
                </div>

                {/* Return type legend */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {returnTypes.map(rt => {
                        const Icon = rt.icon;
                        return (
                            <div key={rt.value}
                                className={`rounded-xl border p-3 ${rt.color}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon className="h-4 w-4 shrink-0" />
                                    <span className="text-xs font-bold uppercase">{rt.label}</span>
                                </div>
                                <p className="text-[10px] opacity-80">{rt.desc}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Items */}
                <div className="rounded-3xl border border-border bg-card shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-foreground flex items-center gap-2">
                            <RotateCcw className="h-4 w-4 text-muted-foreground" /> Produits retournés
                        </h2>
                        <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={addItem}>
                            <Plus className="h-4 w-4 mr-1" /> Ajouter
                        </Button>
                    </div>

                    {/* Header */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        <div className="col-span-4">Produit</div>
                        <div className="col-span-2 text-center">Qté max:</div>
                        <div className="col-span-1 text-center">Qté</div>
                        <div className="col-span-3 text-center">Type retour</div>
                        <div className="col-span-1" />
                    </div>

                    {items.map((item, i) => {
                        const p = getProduct(item.product_id);
                        const maxQty = p?.available ?? 0;
                        return (
                            <div key={i} className="grid grid-cols-12 gap-2 items-center bg-muted/30 rounded-xl p-3">
                                <div className="col-span-12 sm:col-span-4">
                                    <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}
                                        className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500">
                                        <option value="">Sélectionner</option>
                                        {returnableProducts.map(rp => (
                                            <option key={rp.product_id} value={rp.product_id}>
                                                {rp.product_name} ({rp.available} dispo.)
                                            </option>
                                        ))}
                                    </select>
                                    {p && (
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Acheté: {p.total_purchased} | Retourné: {p.total_returned} | Stock: {p.stock_quantity}
                                        </p>
                                    )}
                                </div>
                                <div className="col-span-4 sm:col-span-2 text-center text-sm text-muted-foreground font-mono">
                                    {item.product_id ? maxQty : '—'}
                                </div>
                                <div className="col-span-4 sm:col-span-1">
                                    <Input type="number" min="1" max={maxQty || 1} value={item.quantity}
                                        onChange={e => updateItem(i, 'quantity', Math.min(Number(e.target.value), maxQty || 1))}
                                        className="h-9 text-center rounded-lg" />
                                </div>
                                <div className="col-span-10 sm:col-span-3">
                                    <select value={item.return_type} onChange={e => updateItem(i, 'return_type', e.target.value)}
                                        className="w-full h-9 rounded-lg border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500">
                                        <option value="change">↻ Échange</option>
                                        <option value="refund">$ Remboursement</option>
                                        <option value="loss">✕ Perte</option>
                                    </select>
                                </div>
                                <div className="col-span-2 sm:col-span-1 flex justify-end">
                                    <button onClick={() => removeItem(i)} disabled={items.length === 1}
                                        className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400 flex items-center justify-center disabled:opacity-20">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {returnableProducts.length === 0 && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            <Info className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            Aucun produit retournable. Effectuez d'abord un achat.
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div className="rounded-3xl border border-border bg-card shadow-sm p-6">
                    <Textarea placeholder="Motif du retour (optionnel)…"
                        className="rounded-xl resize-none h-20" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                    <Button variant="outline" className="rounded-xl px-6"
                        onClick={() => router.visit(`/suppliers/${supplier.uuid}`)} disabled={processing}>
                        Annuler
                    </Button>
                    <Button className="rounded-xl px-6 bg-orange-600 hover:bg-orange-700"
                        onClick={handleSubmit} disabled={processing || returnableProducts.length === 0}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {processing ? 'Enregistrement…' : 'Enregistrer le retour'}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
