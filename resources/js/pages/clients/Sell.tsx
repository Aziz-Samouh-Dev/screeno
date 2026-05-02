'use client';

import { useState, useRef, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Save, ShoppingCart, Search, ChevronDown, AlertTriangle } from 'lucide-react';

interface Product {
    id: number;
    nom: string;
    sale_price: number;
    stock_quantity: number;
}

interface Client {
    uuid: string;
    nom: string;
    telephone?: string;
}

interface SellItem {
    product_id: number | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    stock_quantity: number;
}

interface Props {
    client: Client;
    products: Product[];
}

const fmt = (n: number) =>
    Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD';

/* ── Product Combobox (fixed-position dropdown) ── */

function ProductCombobox({
    products,
    value,
    onChange,
    disabledIds,
}: {
    products: Product[];
    value: number | null;
    onChange: (p: Product) => void;
    disabledIds: number[];
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handle = (e: MouseEvent) => {
            if (!triggerRef.current?.contains(e.target as Node) && !dropdownRef.current?.contains(e.target as Node)) {
                setOpen(false); setSearch('');
            }
        };
        const onScroll = (e: Event) => {
            if (dropdownRef.current?.contains(e.target as Node)) return;
            setOpen(false); setSearch('');
        };
        document.addEventListener('mousedown', handle);
        window.addEventListener('scroll', onScroll, true);
        return () => {
            document.removeEventListener('mousedown', handle);
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [open]);

    const openDropdown = () => {
        if (triggerRef.current) {
            const r = triggerRef.current.getBoundingClientRect();
            setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 280) });
        }
        setOpen(v => !v);
    };

    const filtered = products.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()));
    const selected = products.find(p => p.id === value);

    return (
        <div className="relative">
            <button ref={triggerRef} type="button" onClick={openDropdown}
                className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-card px-3 text-sm hover:border-border transition-colors">
                <span className={selected ? 'font-medium text-foreground truncate' : 'text-muted-foreground'}>
                    {selected ? selected.nom : 'Sélectionner un produit…'}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div ref={dropdownRef}
                    style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
                    className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-border/60">
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/40 rounded-lg">
                            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Rechercher un produit…"
                                className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground" />
                        </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                        {filtered.length > 0 ? filtered.map(p => {
                            const alreadyUsed = disabledIds.includes(p.id) && value !== p.id;
                            const noStock = p.stock_quantity <= 0;
                            const disabled = alreadyUsed || noStock;
                            return (
                                <button key={p.id} type="button" disabled={disabled}
                                    onClick={() => { if (!disabled) { onChange(p); setOpen(false); setSearch(''); } }}
                                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                                        value === p.id ? 'bg-blue-50 dark:bg-blue-950/50' :
                                        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent'
                                    }`}>
                                    <span className="font-medium text-foreground text-sm truncate">{p.nom}</span>
                                    <span className={`text-xs font-mono shrink-0 ${
                                        noStock ? 'text-red-500' : p.stock_quantity <= 10 ? 'text-amber-500' : 'text-muted-foreground'
                                    }`}>
                                        {noStock ? 'rupture' : `${p.stock_quantity} dispo.`}
                                    </span>
                                </button>
                            );
                        }) : <p className="px-3 py-4 text-sm text-center text-muted-foreground">Aucun produit trouvé</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Main Component ── */

export default function Sell({ client, products }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clients', href: '/clients' },
        { title: client.nom, href: `/clients/${client.uuid}` },
        { title: 'Vente', href: `/clients/${client.uuid}/sell` },
    ];

    const [items, setItems] = useState<SellItem[]>([
        { product_id: null, product_name: '', quantity: 1, unit_price: 0, stock_quantity: 0 },
    ]);
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const selectedIds = items.map(i => i.product_id).filter(Boolean) as number[];

    const updateItem = (index: number, field: keyof SellItem, val: any) => {
        setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: val } : item));
    };

    const selectProduct = (index: number, product: Product) => {
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, product_id: product.id, product_name: product.nom, unit_price: product.sale_price, stock_quantity: product.stock_quantity } : item
        ));
    };

    const addRow = () => setItems(prev => [...prev, { product_id: null, product_name: '', quantity: 1, unit_price: 0, stock_quantity: 0 }]);
    const removeRow = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

    const anyOverStock = items.some(i => i.product_id !== null && i.quantity > i.stock_quantity);
    const anyEmpty = items.some(i => i.product_id === null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (anyEmpty || anyOverStock) return;
        setProcessing(true);
        router.post(`/clients/${client.uuid}/sell`, {
            items: items.map(({ product_id, quantity, unit_price }) => ({ product_id, quantity, unit_price })),
            notes,
        }, { onFinish: () => setProcessing(false) });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Vente — ${client.nom}`} />

            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl"
                        onClick={() => router.visit('/clients')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Nouvelle vente</h1>
                        <p className="text-sm text-muted-foreground">{client.nom}{client.telephone ? ` · ${client.telephone}` : ''}</p>
                    </div>
                </div>

                {anyOverStock && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        Quantité demandée dépasse le stock disponible pour un ou plusieurs produits.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">

                    {/* Items table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                                <tr>
                                    <th className="px-5 py-3 text-left">Produit</th>
                                    <th className="px-5 py-3 w-28 text-center">Stock dispo.</th>
                                    <th className="px-5 py-3 w-24 text-center">Qté</th>
                                    <th className="px-5 py-3 w-32 text-right">Prix unit.</th>
                                    <th className="px-5 py-3 w-32 text-right">Total</th>
                                    <th className="px-5 py-3 w-10" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {items.map((item, index) => {
                                    const overStock = item.product_id !== null && item.quantity > item.stock_quantity;
                                    return (
                                        <tr key={index} className={overStock ? 'bg-red-50 dark:bg-red-950/20' : 'hover:bg-accent'}>
                                            <td className="px-5 py-2">
                                                <ProductCombobox
                                                    products={products}
                                                    value={item.product_id}
                                                    onChange={(p) => selectProduct(index, p)}
                                                    disabledIds={selectedIds}
                                                />
                                            </td>
                                            <td className="px-5 py-2 text-center">
                                                {item.product_id ? (
                                                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold font-mono ${
                                                        item.stock_quantity === 0 ? 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400' :
                                                        item.stock_quantity <= 10 ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' :
                                                        'bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400'
                                                    }`}>{item.stock_quantity}</span>
                                                ) : <span className="text-muted-foreground/50">—</span>}
                                            </td>
                                            <td className="px-5 py-2 text-center">
                                                <div>
                                                    <Input type="number" min={1}
                                                        max={item.stock_quantity || undefined}
                                                        value={item.quantity}
                                                        onChange={e => updateItem(index, 'quantity', Math.max(1, Number(e.target.value)))}
                                                        className={`w-20 mx-auto text-center h-9 ${overStock ? 'border-red-400' : ''}`} />
                                                    {overStock && (
                                                        <p className="text-xs text-red-500 mt-0.5">max {item.stock_quantity}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-2">
                                                <Input type="number" step="0.01" min={0}
                                                    value={item.unit_price}
                                                    onChange={e => updateItem(index, 'unit_price', Number(e.target.value))}
                                                    className="w-28 ml-auto text-right h-9" />
                                            </td>
                                            <td className="px-5 py-2 text-right font-semibold font-mono text-xs text-foreground">
                                                {fmt(item.quantity * item.unit_price)}
                                            </td>
                                            <td className="px-5 py-2">
                                                {items.length > 1 && (
                                                    <Button type="button" variant="ghost" size="icon"
                                                        onClick={() => removeRow(index)}
                                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                                            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">Cliquez sur « Ajouter » pour commencer.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border/60 px-5 py-4 space-y-4">
                        <Button type="button" variant="outline" size="sm" className="rounded-xl"
                            disabled={selectedIds.length >= products.filter(p => p.stock_quantity > 0).length}
                            onClick={addRow}>
                            <Plus className="w-3 h-3 mr-1" /> Ajouter un produit
                        </Button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Notes (optionnel)</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                    rows={2} placeholder="Remarques sur la vente…"
                                    className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-border" />
                            </div>

                            <div className="bg-muted/40 rounded-2xl p-4 space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Sous-total</span>
                                    <span className="font-mono">{fmt(subtotal)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-foreground text-lg border-t border-border pt-2">
                                    <span>Total</span>
                                    <span className="font-mono">{fmt(subtotal)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" className="rounded-xl"
                                onClick={() => router.visit('/clients')}>Annuler</Button>
                            <Button type="submit" disabled={processing || anyEmpty || anyOverStock} className="rounded-xl px-6">
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? 'Enregistrement…' : 'Enregistrer la vente'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
