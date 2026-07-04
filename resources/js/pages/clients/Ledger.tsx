'use client';

import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart, RotateCcw, CreditCard, TrendingUp, TrendingDown, Printer, Filter, X } from 'lucide-react';

interface Transaction {
    uuid: string;
    type: 'F' | 'R' | 'P';
    product_name: string | null;
    quantity: number | null;
    unit_price: number;
    total_price: number;
    running_total: number;
    notes: string | null;
    created_at: string;
}

interface Client {
    uuid: string;
    nom: string;
    email?: string | null;
    telephone?: string | null;
    ville?: string | null;
}

interface Props {
    client: Client;
    transactions: Transaction[];
    balance: number;
    filters: { date_from: string; date_to: string };
}

const fmt = (n: number) =>
    Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD';

function fmtCombined(iso: string, type: string): string {
    const d = new Date(iso);
    const dd   = String(d.getDate()).padStart(2, '0');
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh   = String(d.getHours()).padStart(2, '0');
    const min  = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min} / ${type}`;
}

const TYPE_COLOR: Record<string, string> = {
    F: 'text-blue-700 dark:text-blue-400',
    R: 'text-purple-700 dark:text-purple-400',
    P: 'text-green-700 dark:text-green-400',
};

type TypeFilter = 'ALL' | 'F' | 'R' | 'P';

const TYPE_LABELS: Record<TypeFilter, string> = {
    ALL: 'Tous',
    F: 'Facture',
    R: 'Retour',
    P: 'Paiement',
};

export default function Ledger({ client, transactions, balance, filters: serverFilters }: Props) {
    const [dateFrom,    setDateFrom]    = useState(serverFilters.date_from);
    const [dateTo,      setDateTo]      = useState(serverFilters.date_to);
    const [typeFilter,  setTypeFilter]  = useState<TypeFilter>('ALL');

    const applyFilters = () => {
        router.get(`/clients/${client.uuid}/ledger`, {
            date_from: dateFrom || undefined,
            date_to:   dateTo   || undefined,
        }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setDateFrom(''); setDateTo('');
        router.get(`/clients/${client.uuid}/ledger`, {}, { replace: true });
    };

    const pdfUrl = () => {
        const p = new URLSearchParams();
        if (dateFrom) p.set('date_from', dateFrom);
        if (dateTo)   p.set('date_to', dateTo);
        const qs = p.toString();
        return `/clients/${client.uuid}/ledger/pdf${qs ? '?' + qs : ''}`;
    };

    const hasFilters = dateFrom || dateTo;

    const visibleTxns = typeFilter === 'ALL'
        ? transactions
        : transactions.filter(t => t.type === typeFilter);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clients', href: '/clients' },
        { title: client.nom, href: `/clients/${client.uuid}` },
        { title: 'Historique', href: `/clients/${client.uuid}/ledger` },
    ];

    const totalSales    = transactions.filter(t => t.type === 'F').reduce((s, t) => s + t.total_price, 0);
    const totalReturns  = transactions.filter(t => t.type === 'R').reduce((s, t) => s + t.total_price, 0);
    const totalPayments = transactions.filter(t => t.type === 'P').reduce((s, t) => s + t.total_price, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Historique · ${client.nom}`} />

            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl"
                            onClick={() => router.visit(`/clients/${client.uuid}`)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">{client.nom}</h1>
                            <p className="text-sm text-muted-foreground">
                                {[client.telephone, client.email, client.ville].filter(Boolean).join(' · ')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" className="rounded-xl text-blue-600 border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            onClick={() => router.visit(`/clients/${client.uuid}/sell`)}>
                            <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Facture
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl text-purple-600 border-purple-200 dark:border-purple-900/60 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                            onClick={() => router.visit(`/clients/${client.uuid}/return`)}>
                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Retour
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl text-green-600 border-green-200 dark:border-green-900/60 hover:bg-green-50 dark:hover:bg-green-950/40"
                            onClick={() => router.visit(`/clients/${client.uuid}/payment`)}>
                            <CreditCard className="h-3.5 w-3.5 mr-1" /> Paiement
                        </Button>
                        <a href={pdfUrl()} target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/90 hover:bg-accent transition-colors">
                            <Printer className="h-3.5 w-3.5" /> PDF
                        </a>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-end gap-3 flex-wrap rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
                    {/* Type pills */}
                    <div className="flex-1 min-w-0">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Type</label>
                        <div className="flex gap-2 flex-wrap">
                            {(['ALL', 'F', 'R', 'P'] as TypeFilter[]).map(t => {
                                const colors: Record<TypeFilter, string> = {
                                    ALL: 'bg-foreground text-background border-foreground',
                                    F:   'bg-blue-600 text-white border-blue-600',
                                    R:   'bg-purple-600 text-white border-purple-600',
                                    P:   'bg-green-600 text-white border-green-600',
                                };
                                const inactive = 'bg-card text-muted-foreground border-border hover:border-muted-foreground/50';
                                return (
                                    <button key={t} type="button"
                                        onClick={() => setTypeFilter(t)}
                                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${typeFilter === t ? colors[t] : inactive}`}>
                                        {TYPE_LABELS[t]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date range */}
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Du</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-border" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Au</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-border" />
                    </div>
                    <Button size="sm" className="rounded-xl" onClick={applyFilters}>
                        <Filter className="h-3.5 w-3.5 mr-1" /> Filtrer
                    </Button>
                    {(hasFilters || typeFilter !== 'ALL') && (
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { clearFilters(); setTypeFilter('ALL'); }}>
                            <X className="h-3.5 w-3.5 mr-1" /> Réinitialiser
                        </Button>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div className="rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 p-4">
                        <p className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wide mb-1">Total ventes</p>
                        <p className="text-xl font-bold text-blue-800 dark:text-blue-300 font-mono">{fmt(totalSales)}</p>
                        <p className="text-xs text-blue-400 mt-0.5">{transactions.filter(t => t.type === 'F').length} opérations</p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/40 p-4">
                        <p className="text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-wide mb-1">Total retours</p>
                        <p className="text-xl font-bold text-purple-800 dark:text-purple-300 font-mono">{fmt(totalReturns)}</p>
                        <p className="text-xs text-purple-400 mt-0.5">{transactions.filter(t => t.type === 'R').length} opérations</p>
                    </div>
                    <div className="rounded-2xl border border-green-100 dark:border-green-900/60 bg-green-50 dark:bg-green-950/40 p-4">
                        <p className="text-xs font-bold text-green-500 dark:text-green-400 uppercase tracking-wide mb-1">Total paiements</p>
                        <p className="text-xl font-bold text-green-800 dark:text-green-300 font-mono">{fmt(totalPayments)}</p>
                        <p className="text-xs text-green-400 mt-0.5">{transactions.filter(t => t.type === 'P').length} paiements</p>
                    </div>
                    <div className={`rounded-2xl p-4 ${
                        balance > 0
                            ? 'bg-foreground'
                            : balance < 0
                            ? 'border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40'
                            : 'border border-green-200 dark:border-green-900/60 bg-green-50 dark:bg-green-950/40'
                    }`}>
                        <div className="flex items-center gap-1 mb-1">
                            {balance > 0
                                ? <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                                : balance < 0
                                ? <TrendingDown className="h-3.5 w-3.5 text-blue-500" />
                                : <TrendingDown className="h-3.5 w-3.5 text-green-500" />}
                            <p className={`text-xs font-bold uppercase tracking-wide ${
                                balance > 0 ? 'text-background/60' : balance < 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-500'
                            }`}>
                                {balance < 0 ? 'Avoir client' : 'Solde à payer'}
                            </p>
                        </div>
                        <p className={`text-xl font-bold font-mono ${
                            balance > 0 ? 'text-amber-400' : balance < 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600'
                        }`}>
                            {fmt(Math.abs(balance))}
                        </p>
                        <p className={`text-xs mt-0.5 ${
                            balance > 0 ? 'text-background/50' : balance < 0 ? 'text-blue-400' : 'text-green-400'
                        }`}>
                            {balance > 0 ? 'En attente' : balance < 0 ? 'Crédit à rembourser' : 'Soldé'}
                        </p>
                    </div>
                </div>

                {/* Transaction table */}
                <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                                <tr>
                                    <th className="px-5 py-3 text-left whitespace-nowrap">Date &amp; Heure / Type</th>
                                    <th className="px-5 py-3 text-left">Produit / Libellé</th>
                                    <th className="px-5 py-3 text-center w-20">Qté</th>
                                    <th className="px-5 py-3 text-right w-36">Prix unit.</th>
                                    <th className="px-5 py-3 text-right w-36">Montant</th>
                                    <th className="px-5 py-3 text-right w-36">RT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {visibleTxns.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">
                                            <ShoppingCart className="w-10 h-10 mx-auto opacity-20 mb-2" />
                                            <p>{transactions.length === 0 ? 'Aucune opération enregistrée' : 'Aucune opération pour ce filtre'}</p>
                                        </td>
                                    </tr>
                                ) : visibleTxns.map((t, idx) => {
                                    const typeColor = TYPE_COLOR[t.type] ?? 'text-foreground/90';
                                    const isDebit   = t.type === 'F';
                                    return (
                                        <tr key={t.uuid}
                                            className={`transition-colors hover:bg-accent ${idx % 2 !== 0 ? 'bg-muted/40' : ''}`}>

                                            {/* Combined date/time/type cell */}
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <span className={`font-mono text-xs font-semibold ${typeColor}`}>
                                                    {fmtCombined(t.created_at, t.type)}
                                                </span>
                                            </td>

                                            {/* Product / Label */}
                                            <td className="px-5 py-3">
                                                <span className="font-medium text-foreground">
                                                    {t.product_name ?? '-'}
                                                </span>
                                                {t.notes && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.notes}</p>
                                                )}
                                            </td>

                                            {/* Qty */}
                                            <td className="px-5 py-3 text-center font-mono text-foreground/90">
                                                {t.quantity ?? '-'}
                                            </td>

                                            {/* Unit price */}
                                            <td className="px-5 py-3 text-right font-mono text-xs text-muted-foreground">
                                                {t.unit_price ? fmt(t.unit_price) : '-'}
                                            </td>

                                            {/* Total price */}
                                            <td className="px-5 py-3 text-right font-mono font-semibold">
                                                <span className={isDebit ? 'text-blue-700 dark:text-blue-400' : t.type === 'R' ? 'text-purple-600 dark:text-purple-400' : 'text-green-600 dark:text-green-400'}>
                                                    {isDebit ? '+' : '-'}{fmt(t.total_price)}
                                                </span>
                                            </td>

                                            {/* Running total */}
                                            <td className="px-5 py-3 text-right font-mono font-bold">
                                                <span className={
                                                    t.running_total > 0
                                                        ? 'text-amber-600 dark:text-amber-400'
                                                        : t.running_total < 0
                                                        ? 'text-blue-600 dark:text-blue-400'
                                                        : 'text-green-600 dark:text-green-400'
                                                }>
                                                    {t.running_total < 0 ? '−' : ''}{fmt(Math.abs(t.running_total))}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {visibleTxns.length > 0 && (
                        <div className="border-t border-border/60 bg-muted/40 px-5 py-3 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                {visibleTxns.length} opération(s)
                                {typeFilter !== 'ALL' ? ` · filtre : ${TYPE_LABELS[typeFilter]}` : ''}
                            </span>
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <span className="text-muted-foreground">
                                    {balance < 0 ? 'Avoir client :' : 'Solde final :'}
                                </span>
                                <span className={`font-mono text-base ${
                                    balance > 0
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : balance < 0
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-green-600 dark:text-green-400'
                                }`}>
                                    {balance < 0 ? '−' : ''}{fmt(Math.abs(balance))}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
