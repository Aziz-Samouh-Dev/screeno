import { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
    ArrowLeft, ShoppingBag, Plus, Trash2, Search, ChevronDown, Package, AlertTriangle, FilePlus,
} from 'lucide-react';

interface Supplier { uuid: string; nom: string; telephone: string; }
interface Product {
    id: number; nom: string; purchase_price: string; sale_price: string;
    stock_quantity: number; stock_alert_threshold: number;
}
interface PurchaseItem {
    product_id: number | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    sale_price: number;
    stock_alert_threshold: number;
    stock_quantity: number;
}

const fmt = (n: number) => Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD';

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
            setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 320) });
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
                            const lowStock = p.stock_quantity <= p.stock_alert_threshold;
                            return (
                                <button key={p.id} type="button" disabled={alreadyUsed}
                                    onClick={() => { if (!alreadyUsed) { onChange(p); setOpen(false); setSearch(''); } }}
                                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                                        value === p.id ? 'bg-blue-50 dark:bg-blue-950/50' :
                                        alreadyUsed ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent'
                                    }`}>
                                    <span className="font-medium text-foreground text-sm truncate">{p.nom}</span>
                                    <span className={`text-xs font-mono shrink-0 ${
                                        lowStock ? 'text-amber-500' : 'text-muted-foreground'
                                    }`}>
                                        {p.stock_quantity} en stock
                                    </span>
                                </button>
                            );
                        }) : (
                            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                Aucun produit trouvé.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Purchase() {
    const { supplier, products } = usePage().props as unknown as { supplier: Supplier; products: Product[] };
    const [items, setItems] = useState<PurchaseItem[]>([
        { product_id: null, product_name: '', quantity: 1, unit_price: 0, sale_price: 0, stock_alert_threshold: 10, stock_quantity: 0 },
    ]);
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    /* ── new product form ── */
    const [showNewForm, setShowNewForm] = useState(false);
    const [newProd, setNewProd] = useState({
        product_name: '', quantity: 1, unit_price: 0, sale_price: 0, stock_alert_threshold: 10,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Fournisseurs', href: '/suppliers' },
        { title: supplier.nom, href: `/suppliers/${supplier.uuid}` },
        { title: 'Achat', href: `/suppliers/${supplier.uuid}/purchase` },
    ];

    const selectedIds = items.map(i => i.product_id).filter(Boolean) as number[];

    const addRow = () => setItems(prev => [...prev, { product_id: null, product_name: '', quantity: 1, unit_price: 0, sale_price: 0, stock_alert_threshold: 10, stock_quantity: 0 }]);
    const removeRow = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

    const updateItem = (index: number, field: keyof PurchaseItem, val: any) => {
        setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: val } : item));
    };

    const selectProduct = (index: number, product: Product) => {
        setItems(prev => prev.map((item, i) =>
            i === index ? {
                ...item,
                product_id: product.id,
                product_name: product.nom,
                unit_price: Number(product.purchase_price),
                sale_price: Number(product.sale_price),
                stock_quantity: product.stock_quantity,
                stock_alert_threshold: product.stock_alert_threshold,
            } : item
        ));
    };

    const createNewProduct = () => {
        if (!newProd.product_name.trim()) {
            toast.error('Veuillez saisir un nom de produit.');
            return;
        }
        if (newProd.quantity < 1) {
            toast.error('La quantité doit être au moins 1.');
            return;
        }
        setProcessing(true);
        router.post(`/suppliers/${supplier.uuid}/purchase`, {
            items: [{
                product_id: 0, is_new: true,
                product_name: newProd.product_name,
                quantity: newProd.quantity,
                unit_price: newProd.unit_price,
                sale_price: newProd.sale_price,
                stock_alert_threshold: newProd.stock_alert_threshold,
            }],
            notes,
        }, {
            onSuccess: () => {
                setShowNewForm(false);
                setNewProd({ product_name: '', quantity: 1, unit_price: 0, sale_price: 0, stock_alert_threshold: 10 });
                toast.success('Nouveau produit créé et ajouté à la facture.');
            },
            onFinish: () => setProcessing(false),
            onError: (e) => {
                const msg = Object.values(e)[0] || "Erreur lors de la création.";
                toast.error(msg);
            },
        });
    };

    const total = items.reduce((sum, it) => sum + (it.unit_price * it.quantity), 0);
    const anyEmpty = items.some(it => it.product_id === null);

    const handleSubmit = () => {
        if (anyEmpty) {
            toast.error('Veuillez sélectionner un produit pour chaque ligne.');
            return;
        }
        if (items.some(it => it.quantity < 1)) {
            toast.error('La quantité doit être au moins 1.');
            return;
        }

        setProcessing(true);
        router.post(`/suppliers/${supplier.uuid}/purchase`, {
            items: items.map(it => ({
                product_id: it.product_id,
                quantity: it.quantity,
                unit_price: it.unit_price,
            })),
            notes,
        }, {
            onFinish: () => setProcessing(false),
            onError: (e) => {
                const msg = Object.values(e)[0] || "Erreur lors de l'achat.";
                toast.error(msg);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Achat — ${supplier.nom}`} />
            <div className="flex flex-col gap-6 p-6 max-w-4xl">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Achat auprès de {supplier.nom}</h1>
                        <p className="text-sm text-muted-foreground">Enregistrer une facture d'achat</p>
                    </div>
                </div>

                {/* Supplier info */}
                <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                        <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-foreground text-sm">{supplier.nom}</p>
                        <p className="text-xs text-muted-foreground">{supplier.telephone}</p>
                    </div>
                </div>

                {/* Error banner */}
                {anyEmpty && items.length > 0 && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        Veuillez sélectionner un produit pour chaque ligne.
                    </div>
                )}

                {/* New product form */}
                {showNewForm && (
                    <div className="rounded-3xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20 shadow-sm p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-foreground flex items-center gap-2 text-sm">
                                <FilePlus className="h-4 w-4 text-blue-600" /> Nouveau produit
                            </h2>
                            <button onClick={() => setShowNewForm(false)}
                                className="text-xs text-muted-foreground hover:text-foreground">Annuler</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="col-span-2 md:col-span-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Nom</label>
                                <Input value={newProd.product_name}
                                    onChange={e => setNewProd(p => ({ ...p, product_name: e.target.value }))}
                                    placeholder="Nom du produit" className="h-9 rounded-lg" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Qté</label>
                                <Input type="number" min="1" value={newProd.quantity}
                                    onChange={e => setNewProd(p => ({ ...p, quantity: Math.max(1, Number(e.target.value)) }))}
                                    className="h-9 rounded-lg text-center" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Prix achat</label>
                                <Input type="number" step="0.01" min="0" value={newProd.unit_price}
                                    onChange={e => setNewProd(p => ({ ...p, unit_price: Number(e.target.value) }))}
                                    className="h-9 rounded-lg text-right font-mono" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Prix vente</label>
                                <Input type="number" step="0.01" min="0" value={newProd.sale_price}
                                    onChange={e => setNewProd(p => ({ ...p, sale_price: Number(e.target.value) }))}
                                    className="h-9 rounded-lg text-right font-mono" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Seuil d'alerte</label>
                                <Input type="number" min="0" value={newProd.stock_alert_threshold}
                                    onChange={e => setNewProd(p => ({ ...p, stock_alert_threshold: Number(e.target.value) }))}
                                    className="h-9 rounded-lg" />
                            </div>
                            <div className="flex items-end justify-end gap-2">
                                <Button variant="outline" size="sm" className="rounded-lg"
                                    onClick={() => setShowNewForm(false)}>Annuler</Button>
                                <Button size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700"
                                    onClick={createNewProduct} disabled={processing}>
                                    <Plus className="h-3.5 w-3.5 mr-1" /> Créer & ajouter
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Items table */}
                <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                                <tr>
                                    <th className="px-4 py-3 text-left w-72">Produit</th>
                                    <th className="px-4 py-3 w-20 text-center">Qté</th>
                                    <th className="px-4 py-3 w-28 text-right">Prix achat</th>
                                    <th className="px-4 py-3 w-28 text-right">Prix vente</th>
                                    <th className="px-4 py-3 w-24 text-right">Alerte</th>
                                    <th className="px-4 py-3 w-28 text-right">Total</th>
                                    <th className="px-4 py-3 w-10" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {items.map((item, index) => {
                                    const prod = products.find(p => p.id === item.product_id);
                                    return (
                                        <tr key={index} className="hover:bg-accent">
                                            <td className="px-4 py-2">
                                                <ProductCombobox
                                                    products={products}
                                                    value={item.product_id}
                                                    onChange={(p) => selectProduct(index, p)}
                                                    disabledIds={selectedIds}
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <Input type="number" min="1" value={item.quantity}
                                                    onChange={e => updateItem(index, 'quantity', Math.max(1, Number(e.target.value)))}
                                                    className="w-16 mx-auto text-center h-9" />
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input type="number" step="0.01" min="0" value={item.unit_price}
                                                    onChange={e => updateItem(index, 'unit_price', Number(e.target.value))}
                                                    className="w-24 ml-auto text-right h-9 font-mono" />
                                            </td>
                                            <td className="px-4 py-2">
                                                {prod ? (
                                                    <span className="block text-right text-xs font-mono text-muted-foreground pt-2">
                                                        {Number(prod.sale_price).toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="block text-right text-xs text-muted-foreground pt-2">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                {prod ? (
                                                    <span className={`text-xs font-mono ${prod.stock_quantity <= prod.stock_alert_threshold ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                                        {prod.stock_alert_threshold}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono font-semibold text-foreground text-sm">
                                                {fmt(item.unit_price * item.quantity)}
                                            </td>
                                            <td className="px-4 py-2">
                                                {items.length > 1 && (
                                                    <button onClick={() => removeRow(index)}
                                                        className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400 flex items-center justify-center">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border/60 px-5 py-4 space-y-4">
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={addRow}>
                                <Plus className="w-3 h-3 mr-1" /> Ajouter un produit
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="rounded-xl border-blue-300 text-blue-700 hover:bg-blue-50"
                                onClick={() => setShowNewForm(v => !v)}>
                                <FilePlus className="w-3 h-3 mr-1" /> Nouveau produit
                            </Button>
                        </div>

                        <div className="flex items-end justify-between gap-4">
                            <div className="flex-1 max-w-md">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Notes (optionnel)</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                    rows={2} placeholder="Remarques sur la facture…"
                                    className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-border" />
                            </div>
                            <div className="bg-muted/40 rounded-2xl p-4 space-y-1 min-w-48 text-right">
                                <p className="text-xs text-muted-foreground">Total facture</p>
                                <p className="text-2xl font-bold font-mono text-foreground">{fmt(total)}</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="outline" className="rounded-xl px-6"
                                onClick={() => router.visit(`/suppliers/${supplier.uuid}`)} disabled={processing}>
                                Annuler
                            </Button>
                            <Button className="rounded-xl px-6 bg-blue-600 hover:bg-blue-700"
                                onClick={handleSubmit} disabled={processing || anyEmpty}>
                                <ShoppingBag className="h-4 w-4 mr-2" />
                                {processing ? 'Enregistrement…' : "Enregistrer l'achat"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
