import { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft, Plus, Trash2,
    Search, ChevronDown, PackageX, AlertTriangle,
    RefreshCw, DollarSign, XCircle, Warehouse,
} from 'lucide-react';

interface Supplier { uuid: string; nom: string; telephone?: string }
interface DamagedProduct {
    product_id: number; product_name: string; quantity: number; unit_price: number;
}
interface DamagedRow {
    product_id: number | null; product_name: string;
    available: number; unit_price: number;
    qty: number; return_type: 'change' | 'refund' | 'loss';
}

const fmt = (n: number) => Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD';

function DamagedCombobox({
    products, value, onChange, disabledIds,
}: {
    products: DamagedProduct[]; value: number | null;
    onChange: (p: DamagedProduct) => void; disabledIds: number[];
}) {
    const [open, setOpen]   = useState(false);
    const [search, setSearch] = useState('');
    const [pos, setPos]     = useState({ top: 0, left: 0, width: 0 });
    const triggerRef        = useRef<HTMLButtonElement>(null);
    const dropRef           = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onMouse = (e: MouseEvent) => {
            if (!triggerRef.current?.contains(e.target as Node) && !dropRef.current?.contains(e.target as Node))
                { setOpen(false); setSearch(''); }
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
                className="flex h-9 w-full items-center justify-between rounded-lg border border-amber-200 dark:border-amber-800 bg-card px-3 text-sm hover:border-amber-300 transition-colors">
                <span className={selected ? 'font-medium text-foreground truncate' : 'text-muted-foreground'}>
                    {selected ? selected.product_name : 'Sélectionner un produit endommagé…'}
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
                            const disabled = disabledIds.includes(p.product_id) && value !== p.product_id;
                            return (
                                <button key={p.product_id} type="button" disabled={disabled}
                                    onClick={() => { if (!disabled) { onChange(p); setOpen(false); setSearch(''); } }}
                                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                                        value === p.product_id ? 'bg-amber-50 dark:bg-amber-950/30' :
                                        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent'
                                    }`}>
                                    <span className="font-medium text-foreground text-sm truncate">{p.product_name}</span>
                                    <span className="text-xs text-muted-foreground font-mono shrink-0">dispo: {p.quantity}</span>
                                </button>
                            );
                        }) : <p className="px-3 py-4 text-sm text-center text-muted-foreground">Aucun produit disponible</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Return() {
    const { supplier, damagedProducts } = usePage().props as unknown as {
        supplier: Supplier;
        damagedProducts: DamagedProduct[];
    };
    const { props } = usePage<{ errors?: Record<string, string> }>();
    const serverError = props.errors?.return_error;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Fournisseurs', href: '/suppliers' },
        { title: supplier.nom, href: `/suppliers/${supplier.uuid}` },
        { title: 'Retour stock endommagé', href: `/suppliers/${supplier.uuid}/return` },
    ];

    const [notes, setNotes]         = useState('');
    const [processing, setProcessing] = useState(false);

    const emptyRow = (): DamagedRow => ({
        product_id: null, product_name: '', available: 0, unit_price: 0,
        qty: 1, return_type: 'refund',
    });

    const [rows, setRows] = useState<DamagedRow[]>([emptyRow()]);

    const selectedIds = rows.filter(r => r.product_id !== null).map(r => r.product_id as number);

    const selectProduct = (idx: number, p: DamagedProduct) =>
        setRows(prev => prev.map((r, i) => i !== idx ? r : {
            ...emptyRow(), product_id: p.product_id, product_name: p.product_name,
            available: p.quantity, unit_price: p.unit_price, qty: 1,
        }));

    const updateQty = (idx: number, val: number) =>
        setRows(prev => prev.map((r, i) => i !== idx ? r : { ...r, qty: Math.max(1, Math.min(val, r.available)) }));

    const updateType = (idx: number, type: 'change' | 'refund' | 'loss') =>
        setRows(prev => prev.map((r, i) => i !== idx ? r : { ...r, return_type: type }));

    const addRow = () => {
        if (!rows[rows.length - 1]?.product_id) return;
        setRows(prev => [...prev, emptyRow()]);
    };
    const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));

    const anyInvalid   = rows.some(r => !r.product_id || r.qty <= 0 || r.qty > r.available);
    const totalRefund  = rows.reduce((s, r) => s + (r.return_type === 'refund' ? r.qty * r.unit_price : 0), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        const items = rows
            .filter(r => r.product_id !== null)
            .map(r => ({ product_id: r.product_id, quantity: r.qty, return_type: r.return_type, from_damaged: true }));

        router.post(`/suppliers/${supplier.uuid}/return`, { items, notes },
            { onFinish: () => setProcessing(false) });
    };

    if (damagedProducts.length === 0) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Retour · ${supplier.nom}`} />
                <div className="flex flex-col gap-6 p-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-xl font-bold text-foreground">Retour stock endommagé · {supplier.nom}</h1>
                    </div>
                    <div className="rounded-3xl border border-border bg-card shadow-sm p-12 text-center">
                        <PackageX className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="font-medium text-muted-foreground">Aucun article endommagé lié à ce fournisseur.</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">Les retours clients endommagés apparaissent ici.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Retour · ${supplier.nom}`} />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Retour stock endommagé</h1>
                        <p className="text-sm text-muted-foreground">{supplier.nom}{supplier.telephone ? ` · ${supplier.telephone}` : ''}</p>
                    </div>
                </div>

                {serverError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4 shrink-0" /> {serverError}
                    </div>
                )}

                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 px-4 py-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <Warehouse className="h-4 w-4 shrink-0" />
                    Retournez directement les articles endommagés (stock endommagé) à ce fournisseur.
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">

                    {rows.map((row, idx) => (
                        <div key={idx} className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-card shadow-sm p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <DamagedCombobox
                                        products={damagedProducts}
                                        value={row.product_id}
                                        onChange={p => selectProduct(idx, p)}
                                        disabledIds={selectedIds}
                                    />
                                </div>
                                {row.product_id && (
                                    <div className="shrink-0 text-right">
                                        <p className="text-xs text-muted-foreground">En stock endommagé</p>
                                        <p className="font-mono font-bold text-sm text-amber-700 dark:text-amber-400">{row.available} u</p>
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
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quantité</span>
                                        <Input type="number" min={1} max={row.available}
                                            value={row.qty}
                                            onChange={e => updateQty(idx, Number(e.target.value))}
                                            className="w-20 h-8 text-sm text-center" />
                                        <span className="text-xs text-muted-foreground">/ {row.available}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {(['change', 'refund', 'loss'] as const).map(t => (
                                            <button key={t} type="button"
                                                onClick={() => updateType(idx, t)}
                                                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                                    row.return_type === t
                                                        ? t === 'change' ? 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                                                          : t === 'refund' ? 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                                                          : 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                                                        : 'border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/30'
                                                }`}>
                                                {t === 'change'  ? <><RefreshCw className="h-3 w-3" /> Échange</>
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
                            onClick={addRow}
                            disabled={!rows[rows.length - 1]?.product_id}>
                            <Plus className="w-3 h-3 mr-1" /> Ajouter un produit endommagé
                        </Button>
                    </div>

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
                                    <span className="font-mono">{fmt(totalRefund)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-foreground text-lg border-t border-border pt-2">
                                    <span>Total remb.</span>
                                    <span className="font-mono text-green-600 dark:text-green-400">{fmt(totalRefund)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" className="rounded-xl"
                                onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>Annuler</Button>
                            <Button type="submit"
                                disabled={processing || anyInvalid}
                                className="rounded-xl px-6 bg-orange-500 hover:bg-orange-600 text-white">
                                <Warehouse className="w-4 h-4 mr-2" />
                                {processing ? 'Enregistrement…' : 'Enregistrer le retour'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
