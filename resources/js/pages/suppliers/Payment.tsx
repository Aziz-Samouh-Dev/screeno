'use client';

import { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, CreditCard, TrendingUp, TrendingDown,
    PackageX, Search, AlertTriangle, Zap, List,
} from 'lucide-react';

interface OutstandingItem {
    product_id: number;
    product_name: string;
    amount_owed: number;
}
interface PaymentMethod { id: number; name: string; code: string }
interface Supplier { uuid: string; nom: string; telephone?: string }
interface Props {
    supplier: Supplier;
    balance: number;
    outstandingItems: OutstandingItem[];
    paymentMethods: PaymentMethod[];
}

const fmt = (n: number) =>
    Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD';

function distribute(total: number, items: OutstandingItem[]) {
    let rem = Math.round(total * 100);
    return items.map(item => {
        const owed = Math.round(item.amount_owed * 100);
        const pay  = Math.min(rem, owed);
        rem -= pay;
        return { ...item, pay: pay / 100 };
    });
}

export default function Payment({ supplier, balance, outstandingItems, paymentMethods }: Props) {
    const { props } = usePage<{ errors?: Record<string, string> }>();
    const serverError = props.errors?.payment_error;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Fournisseurs',     href: '/suppliers' },
        { title: supplier.nom,       href: `/suppliers/${supplier.uuid}` },
        { title: 'Paiement',         href: `/suppliers/${supplier.uuid}/payment` },
    ];

    /* ── mode ─────────────────────────────────────── */
    const [mode, setMode] = useState<'auto' | 'manual'>('auto');

    /* ── auto ─────────────────────────────────────── */
    const [autoAmount, setAutoAmount] = useState('');
    const autoTotal = parseFloat(autoAmount) || 0;
    const distributed = useMemo(() => distribute(autoTotal, outstandingItems), [autoTotal, outstandingItems]);
    const autoPayments = distributed.filter(d => d.pay > 0);
    const autoOver     = autoTotal > balance + 0.005;
    const autoValid    = autoTotal > 0.005 && !autoOver && autoPayments.length > 0;

    /* ── manual ───────────────────────────────────── */
    const [search,  setSearch]  = useState('');
    const [checked, setChecked] = useState<Set<number>>(new Set());
    const [amounts, setAmounts] = useState<Record<number, string>>({});
    const filtered = outstandingItems.filter(i =>
        i.product_name.toLowerCase().includes(search.toLowerCase())
    );

    const toggleAll = () => {
        const allChecked = filtered.every(i => checked.has(i.product_id)) && filtered.length > 0;
        const next = new Set(checked);
        filtered.forEach(i => {
            if (allChecked) next.delete(i.product_id);
            else {
                next.add(i.product_id);
                if (!amounts[i.product_id]) setAmounts(a => ({ ...a, [i.product_id]: String(i.amount_owed) }));
            }
        });
        setChecked(next);
    };
    const toggle = (id: number, def: number) => {
        setChecked(prev => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); }
            else {
                next.add(id);
                if (!amounts[id]) setAmounts(a => ({ ...a, [id]: String(def) }));
            }
            return next;
        });
    };
    const manualTotal = outstandingItems
        .filter(i => checked.has(i.product_id))
        .reduce((s, i) => {
            const v = parseFloat(amounts[i.product_id] ?? String(i.amount_owed));
            return s + (isNaN(v) ? 0 : v);
        }, 0);
    const manualOver = manualTotal > balance + 0.005;
    const manualItemOver = (id: number, owed: number) => {
        const v = parseFloat(amounts[id] ?? String(owed));
        return !isNaN(v) && v > owed + 0.005;
    };
    const hasItemOver = outstandingItems.some(i => checked.has(i.product_id) && manualItemOver(i.product_id, i.amount_owed));
    const manualValid = checked.size > 0 && manualTotal > 0.005 && !manualOver && !hasItemOver;

    /* ── common ───────────────────────────────────── */
    const [reference,  setReference]  = useState('');
    const [notes,      setNotes]      = useState('');
    const [processing, setProcessing] = useState(false);

    const canSubmit = (mode === 'auto' ? autoValid : manualValid) && !processing;
    const summaryTotal = mode === 'auto' ? autoTotal : manualTotal;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setProcessing(true);

        const payments = mode === 'auto'
            ? autoPayments.map(d => ({ product_id: d.product_id, product_name: d.product_name, amount: d.pay }))
            : outstandingItems
                .filter(i => checked.has(i.product_id))
                .map(i => ({
                    product_id:   i.product_id,
                    product_name: i.product_name,
                    amount: parseFloat(amounts[i.product_id] ?? String(i.amount_owed)) || i.amount_owed,
                }));

        router.post(`/suppliers/${supplier.uuid}/payment`,
            { payments, reference, notes },
            { onFinish: () => setProcessing(false) }
        );
    };

    /* ── empty state ──────────────────────────────── */
    if (outstandingItems.length === 0) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Paiement — ${supplier.nom}`} />
                <div className="flex flex-col gap-6 p-6 max-w-4xl">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl"
                            onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-xl font-bold text-foreground">Paiement — {supplier.nom}</h1>
                    </div>
                    <div className="rounded-3xl border border-border bg-card shadow-sm flex flex-col items-center gap-3 py-20 text-muted-foreground">
                        <PackageX className="h-12 w-12 opacity-20" />
                        <p className="font-semibold text-lg">Aucun solde dû</p>
                        <p className="text-sm">Ce fournisseur n'a aucune dette en cours.</p>
                        <Button variant="outline" className="rounded-xl mt-2"
                            onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>
                            Retour au fournisseur
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    /* ── main render ──────────────────────────────── */
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Paiement — ${supplier.nom}`} />

            <div className="flex flex-col gap-6 p-6 max-w-4xl">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl"
                        onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Enregistrer un paiement</h1>
                        <p className="text-sm text-muted-foreground">
                            {supplier.nom}{supplier.telephone ? ` · ${supplier.telephone}` : ''}
                        </p>
                    </div>
                </div>

                {serverError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {serverError}
                    </div>
                )}

                {/* Balance card */}
                <div className={`rounded-2xl p-5 flex items-center justify-between ${
                    balance > 0 ? 'bg-foreground' : 'border border-green-200 dark:border-green-900/60 bg-green-50 dark:bg-green-950/40'
                }`}>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {balance > 0
                                ? <TrendingUp className="h-4 w-4 text-amber-400" />
                                : <TrendingDown className="h-4 w-4 text-green-500" />}
                            <p className={`text-xs font-bold uppercase tracking-wide ${
                                balance > 0 ? 'text-background/60' : 'text-green-500'
                            }`}>Solde total dû</p>
                        </div>
                        <p className={`text-3xl font-bold font-mono ${
                            balance > 0 ? 'text-amber-400' : 'text-green-600'
                        }`}>{fmt(balance)}</p>
                    </div>
                    {balance <= 0 && (
                        <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-950/40 rounded-full px-3 py-1">Soldé</span>
                    )}
                </div>

                {/* Mode switcher */}
                <div className="flex items-center gap-0.5 bg-card border border-border rounded-xl p-1 w-fit shadow-sm">
                    <button type="button" onClick={() => setMode('auto')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            mode === 'auto'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}>
                        <Zap className="h-3.5 w-3.5" />
                        Automatique
                    </button>
                    <button type="button" onClick={() => setMode('manual')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            mode === 'manual'
                                ? 'bg-foreground text-background shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}>
                        <List className="h-3.5 w-3.5" />
                        Manuel
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                    {/* ── AUTO MODE ── */}
                    {mode === 'auto' && (
                        <div className="rounded-3xl border border-indigo-100 dark:border-indigo-900/60 bg-card shadow-sm overflow-hidden">

                            {/* Amount input */}
                            <div className="px-6 py-5 border-b border-border/60 flex flex-col gap-3">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Montant total à régler
                                </label>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="relative">
                                        <input
                                            type="number" min="0.01" step="0.01"
                                            value={autoAmount}
                                            onChange={e => setAutoAmount(e.target.value)}
                                            placeholder="0,00"
                                            autoFocus
                                            className={`w-56 rounded-xl border px-4 py-3 text-2xl font-bold font-mono text-right pr-16 focus:outline-none focus:ring-2 transition-colors bg-card text-foreground ${
                                                autoOver
                                                    ? 'border-red-300 dark:border-red-700 focus:ring-red-200'
                                                    : 'border-indigo-300 dark:border-indigo-700 focus:ring-indigo-300'
                                            }`}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground pointer-events-none">
                                            MAD
                                        </span>
                                    </div>
                                    <button type="button"
                                        onClick={() => setAutoAmount(String(balance))}
                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400 underline-offset-2 hover:underline whitespace-nowrap">
                                        Tout régler ({fmt(balance)})
                                    </button>
                                    {autoOver && (
                                        <span className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            Dépasse le solde dû
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Distribution preview */}
                            {autoTotal > 0.005 && !autoOver && (
                                <>
                                    <div className="px-6 py-2.5 bg-indigo-50/60 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
                                        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                                            Répartition — {autoPayments.length} produit{autoPayments.length > 1 ? 's' : ''} réglé{autoPayments.length > 1 ? 's' : ''}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">Du plus ancien au plus récent</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="border-b border-border/60 bg-muted/40">
                                                <tr>
                                                    <th className="px-6 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Produit</th>
                                                    <th className="px-6 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-36">Montant dû</th>
                                                    <th className="px-6 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-36">Réglé</th>
                                                    <th className="px-6 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-36">Reste après</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {distributed.map(d => {
                                                    const reste = Math.round((d.amount_owed - d.pay) * 100) / 100;
                                                    const full  = reste < 0.005;
                                                    const partial = d.pay > 0.005 && !full;
                                                    return (
                                                        <tr key={d.product_id}
                                                            className={d.pay > 0.005 ? 'bg-green-50/30 dark:bg-green-950/10' : 'opacity-50'}>
                                                            <td className="px-6 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                                                                        full ? 'bg-green-500' : partial ? 'bg-amber-400' : 'bg-border'
                                                                    }`} />
                                                                    <span className="font-medium text-foreground">{d.product_name}</span>
                                                                    {full && (
                                                                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/40 px-1.5 py-0.5 rounded-full">Soldé</span>
                                                                    )}
                                                                    {partial && (
                                                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-full">Partiel</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-right font-mono text-xs text-amber-700 dark:text-amber-400 font-semibold">
                                                                {fmt(d.amount_owed)}
                                                            </td>
                                                            <td className={`px-6 py-3 text-right font-mono font-bold ${
                                                                d.pay > 0.005 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground/50'
                                                            }`}>
                                                                {d.pay > 0.005 ? fmt(d.pay) : '—'}
                                                            </td>
                                                            <td className={`px-6 py-3 text-right font-mono text-xs font-semibold ${
                                                                full ? 'text-green-600 dark:text-green-400' : reste > 0 ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground'
                                                            }`}>
                                                                {full ? '0,00 MAD' : fmt(reste)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot className="border-t-2 border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/10">
                                                <tr>
                                                    <td className="px-6 py-3 text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                                                        Total réglé
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-mono text-xs font-bold text-muted-foreground">
                                                        {fmt(balance)}
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-mono font-bold text-indigo-700 dark:text-indigo-400">
                                                        {fmt(autoTotal)}
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-mono text-xs font-bold text-muted-foreground">
                                                        {fmt(Math.max(0, balance - autoTotal))}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </>
                            )}

                            {/* Empty hint */}
                            {autoTotal <= 0.005 && (
                                <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                                    Entrez le montant à régler pour voir la répartition automatique
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── MANUAL MODE ── */}
                    {mode === 'manual' && (
                        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                            <div className="px-5 py-3 bg-muted/40 border-b border-border/60 flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <input value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Rechercher un produit…"
                                        className="pl-8 w-full rounded-lg border border-border bg-card text-foreground px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200" />
                                </div>
                                <button type="button" onClick={toggleAll}
                                    className="text-xs font-semibold text-green-600 dark:text-green-400 hover:underline whitespace-nowrap">
                                    {filtered.every(i => checked.has(i.product_id)) && filtered.length > 0
                                        ? 'Tout décocher' : 'Tout sélectionner'}
                                </button>
                            </div>
                            {manualOver && (
                                <div className="px-5 py-2.5 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800 flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                    Le total ({fmt(manualTotal)}) dépasse le solde dû ({fmt(balance)})
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                                        <tr>
                                            <th className="px-5 py-2 w-8" />
                                            <th className="px-5 py-2 text-left">Produit</th>
                                            <th className="px-5 py-2 text-right w-40">Montant dû</th>
                                            <th className="px-5 py-2 text-right w-44">Montant à payer</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {filtered.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-sm">
                                                    Aucun produit trouvé
                                                </td>
                                            </tr>
                                        )}
                                        {filtered.map(item => {
                                            const isChecked = checked.has(item.product_id);
                                            const amt = amounts[item.product_id] ?? String(item.amount_owed);
                                            const itemOver = isChecked && manualItemOver(item.product_id, item.amount_owed);
                                            return (
                                                <tr key={item.product_id}
                                                    className={`transition-colors cursor-pointer ${isChecked ? (itemOver ? 'bg-red-50/40 dark:bg-red-950/10' : 'bg-green-50/60 dark:bg-green-950/20') : 'hover:bg-accent'}`}
                                                    onClick={() => toggle(item.product_id, item.amount_owed)}>
                                                    <td className="px-5 py-3 text-center">
                                                        <input type="checkbox" readOnly checked={isChecked}
                                                            className="h-4 w-4 accent-green-600 pointer-events-none" />
                                                    </td>
                                                    <td className="px-5 py-3 font-medium text-foreground">
                                                        {item.product_name}
                                                    </td>
                                                    <td className="px-5 py-3 text-right font-mono text-sm text-amber-700 dark:text-amber-400 font-semibold">
                                                        {fmt(item.amount_owed)}
                                                    </td>
                                                    <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                                                        {isChecked ? (
                                                            <div className="flex flex-col items-end gap-0.5">
                                                                <input type="number" min="0.01" step="0.01"
                                                                    value={amt}
                                                                    onChange={e => setAmounts(a => ({ ...a, [item.product_id]: e.target.value }))}
                                                                    className={`w-36 rounded-lg border bg-card text-foreground px-2 py-1 text-sm font-mono text-right focus:outline-none focus:ring-2 ${
                                                                        itemOver
                                                                            ? 'border-red-300 dark:border-red-700 focus:ring-red-200'
                                                                            : 'border-green-300 dark:border-green-700 focus:ring-green-200'
                                                                    }`}
                                                                />
                                                                {itemOver && (
                                                                    <span className="text-[10px] font-semibold text-red-500">Dépasse le dû</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground/50 text-xs">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Common: method + notes + submit ── */}
                    <div className="rounded-3xl border border-border bg-card shadow-sm p-6 space-y-5">

                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                                Moyen de paiement
                            </label>
                            {paymentMethods.length === 0 ? (
                                <div className="flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                    Aucun moyen de paiement actif —{' '}
                                    <a href="/settings/payment_methods" className="underline font-semibold">
                                        Configurer dans Paramètres
                                    </a>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {paymentMethods.map(m => (
                                        <button key={m.id} type="button"
                                            onClick={() => setReference(prev => prev === m.name ? '' : m.name)}
                                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                                                reference === m.name
                                                    ? 'bg-green-600 text-white border-green-600'
                                                    : 'border-border text-muted-foreground hover:border-green-300 hover:text-green-700 dark:hover:text-green-400'
                                            }`}>
                                            {m.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                                Notes (optionnel)
                            </label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                rows={2} placeholder="Remarques, numéro de chèque…"
                                className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-200" />
                        </div>

                        <div className="flex items-center justify-between border-t border-border/60 pt-4">
                            <div>
                                {canSubmit ? (
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-muted-foreground">
                                            {mode === 'auto'
                                                ? `${autoPayments.length} produit${autoPayments.length > 1 ? 's' : ''} réglé${autoPayments.length > 1 ? 's' : ''} automatiquement`
                                                : `${checked.size} produit${checked.size > 1 ? 's' : ''} sélectionné${checked.size > 1 ? 's' : ''}`}
                                        </p>
                                        <p className={`text-xl font-bold font-mono ${mode === 'auto' ? 'text-indigo-700 dark:text-indigo-400' : 'text-green-700 dark:text-green-400'}`}>
                                            {fmt(summaryTotal)}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {mode === 'auto'
                                            ? 'Entrez le montant à régler'
                                            : manualOver
                                                ? 'Total dépasse le solde dû'
                                                : hasItemOver
                                                    ? 'Un montant dépasse le dû du produit'
                                                    : 'Sélectionnez au moins un produit'}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" className="rounded-xl"
                                    onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={!canSubmit}
                                    className={`rounded-xl px-6 ${mode === 'auto' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'}`}>
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    {processing ? 'Enregistrement…' : 'Confirmer le paiement'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
