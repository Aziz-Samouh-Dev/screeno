import { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft, Plus, Trash2, RotateCcw,
    Search, ChevronDown, PackageX, AlertTriangle,
    RefreshCw, DollarSign, XCircle, Warehouse,
} from 'lucide-react';

interface Supplier { uuid: string; nom: string; telephone?: string }
interface ReturnableProduct {
    product_id: number; product_name: string;
    total_purchased: number; total_returned: number;
    available: number; stock_quantity: number; unit_price: number;
}
interface DamagedProduct {
    product_id: number; product_name: string; quantity: number; unit_price: number;
}

interface ReturnRow {
    product_id: number | null; product_name: string;
    available: number; unit_price: number;
    qty_change: number; qty_refund: number; qty_loss: number;
    show_change: boolean; show_refund: boolean; show_loss: boolean;
}
interface DamagedRow {
    product_id: number | null; product_name: string;
    available: number; unit_price: number;
    qty: number; return_type: 'change' | 'refund' | 'loss';
}

const fmt = (n: number) => Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD';

/* ── Shared Combobox ── */
function ReturnCombobox<T extends { product_id: number; product_name: string; available?: number; quantity?: number }>({
    products, value, onChange, disabledIds, availableKey,
}: {
    products: T[]; value: number | null;
    onChange: (p: T) => void; disabledIds: number[];
    availableKey?: 'available' | 'quantity';
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
        document.addEventListener('mousedown', onMouse);
        return () => document.removeEventListener('mousedown', onMouse);
    }, [open]);

    const openDrop = () => {
        if (triggerRef.current) {
            const r = triggerRef.current.getBoundingClientRect();
            setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 300) });
        }
        setOpen(v => !v);
    };

    const filtered = products.filter(p => p.product_name.toLowerCase().includes(search.toLowerCase()));
    const selected = products.find(p => p.product_id === value);

    return (
        <div className="relative">
            <button ref={triggerRef} type="button" onClick={openDrop}
                className="flex h-9 w-full items-center justify-between rounded-lg border border-orange-200 dark:border-orange-800 bg-card px-3 text-sm hover:border-orange-300 transition-colors">
                <span className={selected ? 'font-medium text-foreground truncate' : 'text-muted-foreground'}>
                    {selected ? selected.product_name : 'Sélectionner un produit…'}
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
                                placeholder="Rechercher…"
                                className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground" />
                        </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length > 0 ? filtered.map(p => {
                            const qty = availableKey ? (p as any)[availableKey] : undefined;
                            const disabled = disabledIds.includes(p.product_id) && value !== p.product_id;
                            return (
                                <button key={p.product_id} type="button" disabled={disabled}
                                    onClick={() => { if (!disabled) { onChange(p); setOpen(false); setSearch(''); } }}
                                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                                        value === p.product_id ? 'bg-orange-50 dark:bg-orange-950/30' :
                                        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent'
                                    }`}>
                                    <span className="font-medium text-foreground text-sm truncate">{p.product_name}</span>
                                    {qty !== undefined && (
                                        <span className="text-xs text-muted-foreground font-mono shrink-0">dispo: {qty}</span>
                                    )}
                                </button>
                            );
                        }) : <p className="px-3 py-4 text-sm text-center text-muted-foreground">Aucun produit disponible</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Main ── */
export default function Return() {
    const { supplier, returnableProducts, damagedProducts } = usePage().props as unknown as {
        supplier: Supplier;
        returnableProducts: ReturnableProduct[];
        damagedProducts: DamagedProduct[];
    };
    const { props } = usePage<{ errors?: Record<string, string> }>();
    const serverError = props.errors?.return_error;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Fournisseurs', href: '/suppliers' },
        { title: supplier.nom, href: `/suppliers/${supplier.uuid}` },
        { title: 'Retour', href: `/suppliers/${supplier.uuid}/return` },
    ];

    const [tab, setTab] = useState<'standard' | 'damaged'>(() => {
        if (typeof window !== 'undefined') {
            const p = new URLSearchParams(window.location.search);
            return p.get('tab') === 'damaged' ? 'damaged' : 'standard';
        }
        return 'standard';
    });
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    /* ── Standard return rows ── */
    const emptyRow = (): ReturnRow => ({
        product_id: null, product_name: '', available: 0, unit_price: 0,
        qty_change: 0, qty_refund: 0, qty_loss: 0,
        show_change: false, show_refund: false, show_loss: false,
    });

    const [rows, setRows] = useState<ReturnRow[]>([emptyRow()]);

    const selectedIds    = rows.filter(r => r.product_id !== null).map(r => r.product_id as number);
    const rowTotal       = (r: ReturnRow) => r.qty_change + r.qty_refund + r.qty_loss;
    const rowOver        = (r: ReturnRow) => r.product_id !== null && rowTotal(r) > r.available;

    const selectProduct = (idx: number, p: ReturnableProduct) =>
        setRows(prev => prev.map((r, i) => i !== idx ? r : {
            ...emptyRow(), product_id: p.product_id, product_name: p.product_name,
            available: p.available, unit_price: p.unit_price,
        }));

    const updateQty = (idx: number, type: 'qty_change' | 'qty_refund' | 'qty_loss', val: number) =>
        setRows(prev => prev.map((r, i) => i !== idx ? r : { ...r, [type]: Math.max(0, val) }));

    const toggleType = (idx: number, type: 'show_change' | 'show_refund' | 'show_loss', qtyKey: 'qty_change' | 'qty_refund' | 'qty_loss') =>
        setRows(prev => prev.map((r, i) => {
            if (i !== idx) return r;
            const newVal = !r[type];
            return { ...r, [type]: newVal, [qtyKey]: newVal ? (r[qtyKey] || 1) : 0 };
        }));

    const addRow = () => {
        const last = rows[rows.length - 1];
        if (!last.product_id || rowTotal(last) === 0) return;
        setRows(prev => [...prev, emptyRow()]);
    };
    const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));

    const anyInvalid = rows.some(r => !r.product_id || rowTotal(r) === 0 || rowOver(r));
    const totalRefund = rows.reduce((s, r) => s + r.qty_refund * r.unit_price, 0);

    /* ── Damaged return rows ── */
    const emptyDamagedRow = (): DamagedRow => ({
        product_id: null, product_name: '', available: 0, unit_price: 0,
        qty: 1, return_type: 'refund',
    });

    const [damagedRows, setDamagedRows] = useState<DamagedRow[]>([emptyDamagedRow()]);

    const selectedDamagedIds = damagedRows.filter(r => r.product_id !== null).map(r => r.product_id as number);

    const selectDamaged = (idx: number, p: DamagedProduct) =>
        setDamagedRows(prev => prev.map((r, i) => i !== idx ? r : {
            ...emptyDamagedRow(), product_id: p.product_id, product_name: p.product_name,
            available: p.quantity, unit_price: p.unit_price, qty: 1,
        }));

    const updateDamagedQty = (idx: number, val: number) =>
        setDamagedRows(prev => prev.map((r, i) => i !== idx ? r : { ...r, qty: Math.max(1, Math.min(val, r.available)) }));

    const updateDamagedType = (idx: number, type: 'change' | 'refund' | 'loss') =>
        setDamagedRows(prev => prev.map((r, i) => i !== idx ? r : { ...r, return_type: type }));

    const addDamagedRow = () => {
        const last = damagedRows[damagedRows.length - 1];
        if (!last.product_id) return;
        setDamagedRows(prev => [...prev, emptyDamagedRow()]);
    };
    const removeDamagedRow = (idx: number) => setDamagedRows(prev => prev.filter((_, i) => i !== idx));

    const anyDamagedInvalid = damagedRows.some(r => !r.product_id || r.qty <= 0 || r.qty > r.available);
    const totalDamagedRefund = damagedRows.reduce((s, r) => s + (r.return_type === 'refund' ? r.qty * r.unit_price : 0), 0);

    /* ── Submit ── */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const items: { product_id: number; quantity: number; return_type: string; from_damaged?: boolean }[] = [];

        if (tab === 'standard') {
            rows.forEach(r => {
                if (r.product_id === null) return;
                if (r.qty_change > 0) items.push({ product_id: r.product_id, quantity: r.qty_change, return_type: 'change' });
                if (r.qty_refund > 0) items.push({ product_id: r.product_id, quantity: r.qty_refund, return_type: 'refund' });
                if (r.qty_loss   > 0) items.push({ product_id: r.product_id, quantity: r.qty_loss,   return_type: 'loss'   });
            });
        } else {
            damagedRows.forEach(r => {
                if (r.product_id === null) return;
                items.push({ product_id: r.product_id, quantity: r.qty, return_type: r.return_type, from_damaged: true });
            });
        }

        router.post(`/suppliers/${supplier.uuid}/return`, { items, notes },
            { onFinish: () => setProcessing(false) });
    };

    const nothingToDo = returnableProducts.length === 0 && damagedProducts.length === 0;

    if (nothingToDo) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Retour · ${supplier.nom}`} />
                <div className="flex flex-col gap-6 p-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-xl font-bold text-foreground">Retour · {supplier.nom}</h1>
                    </div>
                    <div className="rounded-3xl border border-border bg-card shadow-sm p-12 text-center">
                        <PackageX className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="font-medium text-muted-foreground">Aucun produit retournable.</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">Enregistrez d'abord un achat.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const isStandardDisabled = tab === 'standard' && anyInvalid;
    const isDamagedDisabled  = tab === 'damaged'  && anyDamagedInvalid;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Retour · ${supplier.nom}`} />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Retour fournisseur</h1>
                        <p className="text-sm text-muted-foreground">{supplier.nom}{supplier.telephone ? ` · ${supplier.telephone}` : ''}</p>
                    </div>
                </div>

                {serverError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4 shrink-0" /> {serverError}
                    </div>
                )}

                {/* Tab selector */}
                <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1 w-fit">
                    <button type="button"
                        onClick={() => setTab('standard')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            tab === 'standard'
                                ? 'bg-card shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        Retour standard
                        {returnableProducts.length > 0 && (
                            <span className="ml-1 bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {returnableProducts.length}
                            </span>
                        )}
                    </button>
                    <button type="button"
                        onClick={() => setTab('damaged')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            tab === 'damaged'
                                ? 'bg-card shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}>
                        <Warehouse className="h-3.5 w-3.5" />
                        Stock endommagé
                        {damagedProducts.length > 0 && (
                            <span className="ml-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {damagedProducts.length}
                            </span>
                        )}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">

                    {/* ── STANDARD RETURN ── */}
                    {tab === 'standard' && (
                        <>
                            {returnableProducts.length === 0 ? (
                                <div className="rounded-2xl border border-border bg-card p-8 text-center">
                                    <PackageX className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Aucun produit retournable disponible.</p>
                                </div>
                            ) : (
                                <>
                                    {rows.map((row, idx) => {
                                        const used      = rowTotal(row);
                                        const over      = rowOver(row);
                                        const remaining = row.available - used;

                                        return (
                                            <div key={idx} className={`rounded-2xl border bg-card shadow-sm p-4 space-y-3 ${over ? 'border-red-300 dark:border-red-700' : 'border-border'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1">
                                                        <ReturnCombobox
                                                            products={returnableProducts}
                                                            value={row.product_id}
                                                            onChange={p => selectProduct(idx, p)}
                                                            disabledIds={selectedIds}
                                                            availableKey="available"
                                                        />
                                                    </div>
                                                    {row.product_id && (
                                                        <div className="shrink-0 text-right">
                                                            <p className="text-xs text-muted-foreground">Disponible</p>
                                                            <p className="font-mono font-bold text-sm text-foreground">{row.available} u</p>
                                                        </div>
                                                    )}
                                                    {row.product_id && (
                                                        <div className={`shrink-0 text-right min-w-20 ${over ? 'text-red-500' : remaining === 0 && used > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                                            <p className="text-xs">Utilisé / Restant</p>
                                                            <p className="font-mono font-bold text-sm">{used} / {remaining}</p>
                                                        </div>
                                                    )}
                                                    {rows.length > 1 && (
                                                        <Button type="button" variant="ghost" size="icon"
                                                            onClick={() => removeRow(idx)}
                                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 h-8 w-8 shrink-0">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                </div>

                                                {row.product_id && (
                                                    <div className="flex flex-wrap gap-3">
                                                        {/* Échange */}
                                                        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${row.show_change ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30' : 'border-border hover:border-blue-200 bg-muted/30'}`}>
                                                            <button type="button" onClick={() => toggleType(idx, 'show_change', 'qty_change')}
                                                                className={`flex items-center gap-1.5 text-xs font-semibold ${row.show_change ? 'text-blue-700 dark:text-blue-400' : 'text-muted-foreground hover:text-blue-600'}`}>
                                                                <RefreshCw className="h-3.5 w-3.5" /> Échange
                                                            </button>
                                                            {row.show_change && (
                                                                <Input type="number" min={0} max={row.available}
                                                                    value={row.qty_change || ''}
                                                                    onChange={e => updateQty(idx, 'qty_change', Number(e.target.value))}
                                                                    placeholder="Qté"
                                                                    className="w-20 h-7 text-sm text-center border-blue-200 dark:border-blue-700 focus-visible:ring-blue-300" />
                                                            )}
                                                        </div>
                                                        {/* Remboursement */}
                                                        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${row.show_refund ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30' : 'border-border hover:border-green-200 bg-muted/30'}`}>
                                                            <button type="button" onClick={() => toggleType(idx, 'show_refund', 'qty_refund')}
                                                                className={`flex items-center gap-1.5 text-xs font-semibold ${row.show_refund ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground hover:text-green-600'}`}>
                                                                <DollarSign className="h-3.5 w-3.5" /> Remboursement
                                                                {row.show_refund && row.qty_refund > 0 && (
                                                                    <span className="ml-1 text-green-600">= {fmt(row.qty_refund * row.unit_price)}</span>
                                                                )}
                                                            </button>
                                                            {row.show_refund && (
                                                                <Input type="number" min={0} max={row.available}
                                                                    value={row.qty_refund || ''}
                                                                    onChange={e => updateQty(idx, 'qty_refund', Number(e.target.value))}
                                                                    placeholder="Qté"
                                                                    className="w-20 h-7 text-sm text-center border-green-200 dark:border-green-700 focus-visible:ring-green-300" />
                                                            )}
                                                        </div>
                                                        {/* Perte */}
                                                        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${row.show_loss ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30' : 'border-border hover:border-red-200 bg-muted/30'}`}>
                                                            <button type="button" onClick={() => toggleType(idx, 'show_loss', 'qty_loss')}
                                                                className={`flex items-center gap-1.5 text-xs font-semibold ${row.show_loss ? 'text-red-700 dark:text-red-400' : 'text-muted-foreground hover:text-red-600'}`}>
                                                                <XCircle className="h-3.5 w-3.5" /> Perte
                                                            </button>
                                                            {row.show_loss && (
                                                                <Input type="number" min={0} max={row.available}
                                                                    value={row.qty_loss || ''}
                                                                    onChange={e => updateQty(idx, 'qty_loss', Number(e.target.value))}
                                                                    placeholder="Qté"
                                                                    className="w-20 h-7 text-sm text-center border-red-200 dark:border-red-700 focus-visible:ring-red-300" />
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {over && (
                                                    <p className="text-xs font-semibold text-red-500 flex items-center gap-1">
                                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                                        Total ({used}) dépasse la quantité disponible ({row.available}).
                                                    </p>
                                                )}
                                                {row.product_id && !row.show_change && !row.show_refund && !row.show_loss && (
                                                    <p className="text-xs text-muted-foreground">Cliquez sur un type de retour pour saisir la quantité.</p>
                                                )}
                                            </div>
                                        );
                                    })}

                                    <div className="flex items-center gap-3">
                                        <Button type="button" variant="outline" size="sm" className="rounded-xl"
                                            onClick={addRow}
                                            disabled={!rows[rows.length - 1]?.product_id || rowTotal(rows[rows.length - 1]) === 0}>
                                            <Plus className="w-3 h-3 mr-1" /> Ajouter un produit
                                        </Button>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* ── DAMAGED STOCK RETURN ── */}
                    {tab === 'damaged' && (
                        <>
                            {damagedProducts.length === 0 ? (
                                <div className="rounded-2xl border border-border bg-card p-8 text-center">
                                    <Warehouse className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Aucun article endommagé lié à ce fournisseur.</p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">Les retours clients endommagés apparaissent ici.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 px-4 py-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                                        <Warehouse className="h-4 w-4 shrink-0" />
                                        Retournez directement les articles endommagés (stock endommagé) à ce fournisseur.
                                    </div>

                                    {damagedRows.map((row, idx) => (
                                        <div key={idx} className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-card shadow-sm p-4 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <ReturnCombobox
                                                        products={damagedProducts}
                                                        value={row.product_id}
                                                        onChange={p => selectDamaged(idx, p)}
                                                        disabledIds={selectedDamagedIds}
                                                        availableKey="quantity"
                                                    />
                                                </div>
                                                {row.product_id && (
                                                    <div className="shrink-0 text-right">
                                                        <p className="text-xs text-muted-foreground">En stock endommagé</p>
                                                        <p className="font-mono font-bold text-sm text-amber-700 dark:text-amber-400">{row.available} u</p>
                                                    </div>
                                                )}
                                                {damagedRows.length > 1 && (
                                                    <Button type="button" variant="ghost" size="icon"
                                                        onClick={() => removeDamagedRow(idx)}
                                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 h-8 w-8 shrink-0">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                            </div>

                                            {row.product_id && (
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    {/* Quantity */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quantité</span>
                                                        <Input type="number" min={1} max={row.available}
                                                            value={row.qty}
                                                            onChange={e => updateDamagedQty(idx, Number(e.target.value))}
                                                            className="w-20 h-8 text-sm text-center" />
                                                        <span className="text-xs text-muted-foreground">/ {row.available}</span>
                                                    </div>
                                                    {/* Type */}
                                                    <div className="flex items-center gap-1.5">
                                                        {(['change', 'refund', 'loss'] as const).map(t => (
                                                            <button key={t} type="button"
                                                                onClick={() => updateDamagedType(idx, t)}
                                                                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                                                    row.return_type === t
                                                                        ? t === 'change' ? 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                                                                          : t === 'refund' ? 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                                                                          : 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                                                                        : 'border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/30'
                                                                }`}>
                                                                {t === 'change' ? <><RefreshCw className="h-3 w-3" /> Échange</>
                                                                 : t === 'refund' ? <><DollarSign className="h-3 w-3" /> Remboursement</>
                                                                 : <><XCircle className="h-3 w-3" /> Perte</>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {row.return_type === 'refund' && row.qty > 0 && row.unit_price > 0 && (
                                                        <span className="text-xs font-semibold text-green-600">
                                                            = {fmt(row.qty * row.unit_price)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <div className="flex items-center gap-3">
                                        <Button type="button" variant="outline" size="sm" className="rounded-xl"
                                            onClick={addDamagedRow}
                                            disabled={!damagedRows[damagedRows.length - 1]?.product_id}>
                                            <Plus className="w-3 h-3 mr-1" /> Ajouter un produit endommagé
                                        </Button>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Footer */}
                    <div className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Notes (optionnel)</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                    placeholder="Motif du retour…"
                                    className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-border" />
                            </div>
                            <div className="bg-muted/40 rounded-2xl p-4 space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Remboursement estimé</span>
                                    <span className="font-mono">{fmt(tab === 'standard' ? totalRefund : totalDamagedRefund)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-foreground text-lg border-t border-border pt-2">
                                    <span>Total remb.</span>
                                    <span className="font-mono text-green-600 dark:text-green-400">
                                        {fmt(tab === 'standard' ? totalRefund : totalDamagedRefund)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" className="rounded-xl"
                                onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>Annuler</Button>
                            <Button type="submit"
                                disabled={processing || (tab === 'standard' ? isStandardDisabled : isDamagedDisabled)}
                                className="rounded-xl px-6 bg-orange-500 hover:bg-orange-600 text-white">
                                {tab === 'damaged' && <Warehouse className="w-4 h-4 mr-2" />}
                                {!tab || tab === 'standard' ? <RotateCcw className="w-4 h-4 mr-2" /> : null}
                                {processing ? 'Enregistrement…' : 'Enregistrer le retour'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
