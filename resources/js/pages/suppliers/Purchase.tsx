import { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft, Plus, Trash2, Save, ShoppingBag,
    Search, ChevronDown, PackagePlus, AlertTriangle,
} from 'lucide-react';

interface Supplier { uuid: string; nom: string; telephone?: string }
interface Product {
    id: number; nom: string; purchase_price: number; sale_price: number;
    stock_quantity: number; stock_alert_threshold: number;
}
interface PurchaseRow {
    is_new: boolean;
    product_id: number | null;
    product_name: string;
    quantity: number;
    unit_price: number;       // purchase price
    sale_price: number;
    stock_alert_threshold: number;
    stock_quantity: number;
}

const fmt = (n: number) => Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD';

/* ── Combobox ── */
function ProductCombobox({ products, value, onChange, disabledIds }: {
    products: Product[]; value: number | null;
    onChange: (p: Product | null, newName?: string) => void;
    disabledIds: number[];
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropRef    = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onMouse = (e: MouseEvent) => {
            if (!triggerRef.current?.contains(e.target as Node) && !dropRef.current?.contains(e.target as Node)) {
                setOpen(false); setSearch('');
            }
        };
        const onScroll = (e: Event) => {
            if (dropRef.current?.contains(e.target as Node)) return;
            setOpen(false); setSearch('');
        };
        document.addEventListener('mousedown', onMouse);
        window.addEventListener('scroll', onScroll, true);
        return () => { document.removeEventListener('mousedown', onMouse); window.removeEventListener('scroll', onScroll, true); };
    }, [open]);

    const openDrop = () => {
        if (triggerRef.current) {
            const r = triggerRef.current.getBoundingClientRect();
            setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 300) });
        }
        setOpen(v => !v);
    };

    const filtered  = products.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()));
    const selected  = value === -1 ? null : products.find(p => p.id === value);
    const showNew   = search.trim().length > 0 && !filtered.some(p => p.nom.toLowerCase() === search.toLowerCase());

    return (
        <div className="relative">
            <button ref={triggerRef} type="button" onClick={openDrop}
                className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-card px-3 text-sm hover:border-blue-300 transition-colors">
                <span className={value === -1 ? 'font-medium text-blue-600 dark:text-blue-400 truncate' : selected ? 'font-medium text-foreground truncate' : 'text-muted-foreground'}>
                    {value === -1 ? '+ Nouveau produit' : selected ? selected.nom : 'Sélectionner…'}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div ref={dropRef} style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
                    className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-border/60">
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/40 rounded-lg">
                            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Rechercher ou créer…"
                                className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground" />
                        </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {showNew && (
                            <button type="button"
                                onClick={() => { onChange(null, search.trim()); setOpen(false); setSearch(''); }}
                                className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 border-b border-border/40 transition-colors">
                                <PackagePlus className="h-4 w-4 text-blue-500 shrink-0" />
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Créer « {search.trim()} »</span>
                            </button>
                        )}
                        {filtered.map(p => {
                            const disabled = disabledIds.includes(p.id) && value !== p.id;
                            return (
                                <button key={p.id} type="button" disabled={disabled}
                                    onClick={() => { if (!disabled) { onChange(p); setOpen(false); setSearch(''); } }}
                                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 transition-colors text-sm ${
                                        value === p.id ? 'bg-blue-50 dark:bg-blue-950/40' :
                                        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent'
                                    }`}>
                                    <span className="font-medium text-foreground truncate">{p.nom}</span>
                                    <span className="text-xs font-mono text-muted-foreground shrink-0">{Number(p.purchase_price).toFixed(2)} MAD</span>
                                </button>
                            );
                        })}
                        {filtered.length === 0 && !showNew && (
                            <p className="px-3 py-4 text-sm text-center text-muted-foreground">Aucun produit trouvé</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Main ── */
export default function Purchase() {
    const { supplier, products } = usePage().props as unknown as { supplier: Supplier; products: Product[] };
    const { props } = usePage<{ errors?: Record<string, string> }>();
    const serverError = props.errors?.purchase_error;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Fournisseurs', href: '/suppliers' },
        { title: supplier.nom, href: `/suppliers/${supplier.uuid}` },
        { title: 'Achat', href: `/suppliers/${supplier.uuid}/purchase` },
    ];

    const emptyRow = (): PurchaseRow => ({
        is_new: false, product_id: null, product_name: '',
        quantity: 1, unit_price: 0, sale_price: 0,
        stock_alert_threshold: 10, stock_quantity: 0,
    });

    const [rows, setRows] = useState<PurchaseRow[]>([]);
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const selectedIds = rows.filter(r => !r.is_new && r.product_id !== null).map(r => r.product_id as number);

    /* "Ajouter un produit existant":
       - if last row is an empty new-product row → replace it with a combobox row
       - if last row is an empty combobox → block (already one open)
       - otherwise → append */
    const addRow = () => {
        setRows(prev => {
            const existing = emptyRow();
            if (prev.length === 0) return [existing];
            const last = prev[prev.length - 1];
            // Replace empty new-product row
            if (last.is_new && !last.product_name.trim())
                return [...prev.slice(0, -1), existing];
            // Block if last is already an empty combobox
            if (!last.is_new && last.product_id === null) return prev;
            return [...prev, existing];
        });
    };

    /* "Nouveau produit" button logic:
       - if last row is an empty combobox (no product picked) → replace it with a new-product row
       - if last row is a new product with empty name → block
       - otherwise → append */
    const addNewProductRow = () => {
        setRows(prev => {
            const newRow = { ...emptyRow(), is_new: true, product_id: -1 };
            if (prev.length === 0) return [newRow];
            const last = prev[prev.length - 1];
            // Replace empty existing-product selector row
            if (!last.is_new && last.product_id === null)
                return [...prev.slice(0, -1), newRow];
            // Block if current new-product name is still empty
            if (last.is_new && !last.product_name.trim()) return prev;
            return [...prev, newRow];
        });
    };

    const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));

    const selectProduct = (idx: number, p: Product | null, newName?: string) =>
        setRows(prev => prev.map((row, i) => {
            if (i !== idx) return row;
            if (p === null && newName) return { ...row, is_new: true, product_id: -1, product_name: newName, unit_price: 0, sale_price: 0 };
            if (p) return { ...row, is_new: false, product_id: p.id, product_name: p.nom, unit_price: p.purchase_price, sale_price: p.sale_price, stock_quantity: p.stock_quantity };
            return row;
        }));

    const update = (idx: number, field: keyof PurchaseRow, val: any) =>
        setRows(prev => prev.map((row, i) => i !== idx ? row : { ...row, [field]: val }));

    const subtotal = rows.reduce((s, r) => s + r.quantity * r.unit_price, 0);
    const anyEmpty = rows.length === 0 || rows.some(r => !r.product_name.trim() || r.quantity < 1);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (anyEmpty) return;
        setProcessing(true);
        router.post(`/suppliers/${supplier.uuid}/purchase`, {
            items: rows.map(r => ({
                is_new: r.is_new,
                product_id: r.is_new ? 0 : r.product_id,
                product_name: r.product_name,
                quantity: r.quantity,
                unit_price: r.unit_price,
                sale_price: r.sale_price,
                stock_alert_threshold: r.stock_alert_threshold,
            })),
            notes,
        }, { onFinish: () => setProcessing(false) });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Achat — ${supplier.nom}`} />

            <div className="flex flex-col gap-6 p-6">

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl"
                        onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Nouvel achat</h1>
                        <p className="text-sm text-muted-foreground">{supplier.nom}{supplier.telephone ? ` · ${supplier.telephone}` : ''}</p>
                    </div>
                </div>

                {serverError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4 shrink-0" /> {serverError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">

                    {rows.length > 0 && <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[700px]">
                            <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                                <tr>
                                    <th className="px-4 py-3 text-left">Produit</th>
                                    <th className="px-4 py-3 w-20 text-center">Qté</th>
                                    <th className="px-4 py-3 w-36 text-right">Prix achat (MAD)</th>
                                    <th className="px-4 py-3 w-36 text-right">Prix vente (MAD)</th>
                                    {rows.some(r => r.is_new) && <th className="px-4 py-3 w-28 text-center">Seuil alerte</th>}
                                    <th className="px-4 py-3 w-32 text-right">Total</th>
                                    <th className="px-4 py-3 w-10" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {rows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-accent/30">
                                        <td className="px-4 py-2.5">
                                            {row.is_new ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded-full shrink-0">
                                                        <PackagePlus className="h-3 w-3" /> Nouveau
                                                    </span>
                                                    <Input
                                                        value={row.product_name}
                                                        onChange={e => update(idx, 'product_name', e.target.value)}
                                                        placeholder="Nom du produit…"
                                                        className="h-8 rounded-lg text-sm border-blue-200 dark:border-blue-800 focus-visible:ring-blue-300"
                                                    />
                                                </div>
                                            ) : (
                                                <ProductCombobox
                                                    products={products}
                                                    value={row.product_id}
                                                    onChange={(p, newName) => selectProduct(idx, p, newName)}
                                                    disabledIds={selectedIds}
                                                />
                                            )}
                                        </td>

                                        <td className="px-4 py-2.5">
                                            <Input type="number" min={1} value={row.quantity}
                                                onChange={e => update(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                                                className="w-16 mx-auto text-center h-8" />
                                        </td>

                                        <td className="px-4 py-2.5">
                                            <Input type="number" step="0.01" min={0} value={row.unit_price}
                                                onChange={e => update(idx, 'unit_price', Number(e.target.value))}
                                                className="w-28 ml-auto text-right h-8" />
                                        </td>

                                        <td className="px-4 py-2.5">
                                            <Input type="number" step="0.01" min={0} value={row.sale_price}
                                                onChange={e => update(idx, 'sale_price', Number(e.target.value))}
                                                className="w-28 ml-auto text-right h-8" />
                                        </td>

                                        {rows.some(r => r.is_new) && (
                                            <td className="px-4 py-2.5">
                                                {row.is_new && (
                                                    <Input type="number" min={0} value={row.stock_alert_threshold}
                                                        onChange={e => update(idx, 'stock_alert_threshold', Number(e.target.value))}
                                                        className="w-20 mx-auto text-center h-8" />
                                                )}
                                            </td>
                                        )}

                                        <td className="px-4 py-2.5 text-right font-semibold font-mono text-xs text-foreground">
                                            {fmt(row.quantity * row.unit_price)}
                                        </td>

                                        <td className="px-4 py-2.5">
                                            {rows.length > 1 && (
                                                <Button type="button" variant="ghost" size="icon"
                                                    onClick={() => removeRow(idx)}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 h-7 w-7">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>}

                    {/* Footer */}
                    <div className={`px-5 py-4 space-y-4 ${rows.length > 0 ? 'border-t border-border/60' : ''}`}>

                        {/* Add buttons */}
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={addRow}>
                                <Plus className="w-3 h-3 mr-1" /> Ajouter un produit existant
                            </Button>
                            <Button type="button" variant="outline" size="sm"
                                className="rounded-xl border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                onClick={addNewProductRow}>
                                <PackagePlus className="w-3 h-3 mr-1" /> Nouveau produit
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Notes (optionnel)</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                    placeholder="Remarques sur l'achat…"
                                    className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-border" />
                            </div>
                            <div className="bg-muted/40 rounded-2xl p-4 space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Sous-total</span>
                                    <span className="font-mono">{fmt(subtotal)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-foreground text-lg border-t border-border pt-2">
                                    <span>Total achat</span>
                                    <span className="font-mono text-blue-700 dark:text-blue-400">{fmt(subtotal)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" className="rounded-xl"
                                onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>Annuler</Button>
                            <Button type="submit" disabled={processing || anyEmpty} className="rounded-xl px-6 bg-blue-600 hover:bg-blue-700">
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? 'Enregistrement…' : "Enregistrer l'achat"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
