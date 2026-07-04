import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, BookOpen, ShoppingBag, RotateCcw, CreditCard, RefreshCw, DollarSign, XCircle, TrendingUp, TrendingDown, FileDown } from 'lucide-react';

interface Supplier { uuid: string; nom: string; email?: string; telephone?: string; ville?: string }
interface Txn {
    uuid: string; type: 'F' | 'R' | 'P'; return_type?: string | null;
    product_name: string; quantity: number | null;
    unit_price: number; total_price: number;
    running_total: number; notes?: string; created_at: string;
}

const fmt = (n: number) => Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD';

function fmtDateTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' });
}

function txnBadge(t: Txn) {
    if (t.type === 'F') return { label: 'ACHAT',     cls: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' };
    if (t.type === 'P') return { label: 'PAIEMENT',  cls: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' };
    if (t.return_type === 'change') return { label: 'ÉCHANGE', cls: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' };
    if (t.return_type === 'refund') return { label: 'REMB.',   cls: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' };
    return { label: 'PERTE', cls: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400' };
}

export default function Ledger() {
    const { supplier, transactions, balance, filters } = usePage().props as unknown as {
        supplier: Supplier; transactions: Txn[]; balance: number; filters: { date_from: string; date_to: string };
    };

    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo,   setDateTo]   = useState(filters.date_to   || '');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Fournisseurs', href: '/suppliers' },
        { title: supplier.nom,   href: `/suppliers/${supplier.uuid}` },
        { title: 'Grand livre',  href: `/suppliers/${supplier.uuid}/ledger` },
    ];

    const applyFilters = () =>
        router.get(`/suppliers/${supplier.uuid}/ledger`, { date_from: dateFrom, date_to: dateTo },
            { preserveState: true, replace: true });

    const clearFilters = () => {
        setDateFrom(''); setDateTo('');
        router.get(`/suppliers/${supplier.uuid}/ledger`, {}, { preserveState: true, replace: true });
    };

    const totalPurchases = transactions.filter(t => t.type === 'F').reduce((s, t) => s + t.total_price, 0);
    const totalReturns   = transactions.filter(t => t.type === 'R').reduce((s, t) => s + t.total_price, 0);
    const totalPayments  = transactions.filter(t => t.type === 'P').reduce((s, t) => s + t.total_price, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Grand livre · ${supplier.nom}`} />

            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl"
                            onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
                                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Grand livre · {supplier.nom}</h1>
                                <p className="text-sm text-muted-foreground">
                                    {[supplier.email, supplier.telephone, supplier.ville].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700"
                            onClick={() => router.visit(`/suppliers/${supplier.uuid}/purchase`)}>
                            <ShoppingBag className="h-3.5 w-3.5 mr-1.5" /> Achat
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl border-orange-200 text-orange-700 hover:bg-orange-50"
                            onClick={() => router.visit(`/suppliers/${supplier.uuid}/return`)}>
                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retour
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => router.visit(`/suppliers/${supplier.uuid}/payment`)}>
                            <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Paiement
                        </Button>
                        <Button
                            size="sm" variant="outline"
                            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (dateFrom) params.set('date_from', dateFrom);
                                if (dateTo)   params.set('date_to', dateTo);
                                const qs = params.toString();
                                window.open(`/suppliers/${supplier.uuid}/ledger/pdf${qs ? '?' + qs : ''}`, '_blank');
                            }}
                        >
                            <FileDown className="h-3.5 w-3.5 mr-1.5" /> PDF
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 p-4">
                        <p className="text-xs font-bold text-blue-500 uppercase tracking-wide">Total achats</p>
                        <p className="text-xl font-bold text-blue-800 dark:text-blue-300 font-mono mt-1">{fmt(totalPurchases)}</p>
                        <p className="text-xs text-blue-400 mt-0.5">{transactions.filter(t => t.type === 'F').length} achats</p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 dark:border-orange-900/60 bg-orange-50 dark:bg-orange-950/40 p-4">
                        <p className="text-xs font-bold text-orange-500 uppercase tracking-wide">Total retours</p>
                        <p className="text-xl font-bold text-orange-800 dark:text-orange-300 font-mono mt-1">{fmt(totalReturns)}</p>
                        <p className="text-xs text-orange-400 mt-0.5">{transactions.filter(t => t.type === 'R').length} retours</p>
                    </div>
                    <div className="rounded-2xl border border-green-100 dark:border-green-900/60 bg-green-50 dark:bg-green-950/40 p-4">
                        <p className="text-xs font-bold text-green-500 uppercase tracking-wide">Total payé</p>
                        <p className="text-xl font-bold text-green-800 dark:text-green-300 font-mono mt-1">{fmt(totalPayments)}</p>
                        <p className="text-xs text-green-400 mt-0.5">{transactions.filter(t => t.type === 'P').length} paiements</p>
                    </div>
                    <div className={`rounded-2xl p-4 ${balance > 0 ? 'bg-foreground' : balance < 0 ? 'border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40' : 'border border-green-200 dark:border-green-900/60 bg-green-50 dark:bg-green-950/40'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                            {balance > 0 ? <TrendingUp className="h-3.5 w-3.5 text-amber-400" /> : <TrendingDown className={`h-3.5 w-3.5 ${balance < 0 ? 'text-blue-500' : 'text-green-500'}`} />}
                            <p className={`text-xs font-bold uppercase tracking-wide ${balance > 0 ? 'text-background/60' : balance < 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-500'}`}>
                                {balance < 0 ? 'Avoir fournisseur' : 'Solde à payer'}
                            </p>
                        </div>
                        <p className={`text-xl font-bold font-mono ${balance > 0 ? 'text-amber-400' : balance < 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600'}`}>
                            {fmt(Math.abs(balance))}
                        </p>
                        <p className={`text-xs mt-0.5 ${balance > 0 ? 'text-background/50' : balance < 0 ? 'text-blue-400' : 'text-green-400'}`}>
                            {balance > 0 ? 'En attente' : balance < 0 ? 'Crédit fournisseur' : 'Soldé'}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-2xl border border-border bg-card p-4 flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Du</label>
                        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="rounded-xl h-9" />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Au</label>
                        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="rounded-xl h-9" />
                    </div>
                    <Button onClick={applyFilters} className="rounded-xl bg-blue-600 hover:bg-blue-700 shrink-0">Filtrer</Button>
                    {(filters.date_from || filters.date_to) && (
                        <Button variant="outline" onClick={clearFilters} className="rounded-xl shrink-0">Effacer</Button>
                    )}
                </div>

                {/* Transaction table */}
                <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
                        <h3 className="font-bold text-foreground">Toutes les opérations</h3>
                        <span className="text-xs text-muted-foreground">{transactions.length} transaction(s)</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                                <tr>
                                    <th className="px-4 py-3 text-left">Date / Heure / Type</th>
                                    <th className="px-4 py-3 text-left">Produit</th>
                                    <th className="px-4 py-3 text-center w-16">Qté</th>
                                    <th className="px-4 py-3 text-right w-28">Prix unit.</th>
                                    <th className="px-4 py-3 text-right w-28">Montant</th>
                                    <th className="px-4 py-3 text-right w-28">Solde cumulé</th>
                                    <th className="px-4 py-3 text-left w-40">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                                            <ShoppingBag className="w-8 h-8 mx-auto opacity-20 mb-2" />
                                            <p>Aucune opération{(filters.date_from || filters.date_to) ? ' dans cette période' : ''}.</p>
                                        </td>
                                    </tr>
                                ) : transactions.map(t => {
                                    const badge   = txnBadge(t);
                                    const isCredit = t.type === 'P' || (t.type === 'R' && t.return_type === 'refund');
                                    return (
                                        <tr key={t.uuid} className="hover:bg-accent transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-muted-foreground text-xs">{fmtDateTime(t.created_at)}</span>
                                                <span className={`ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${badge.cls}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                {t.product_name ?? <span className="text-muted-foreground italic">-</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono text-muted-foreground">{t.quantity ?? '-'}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                                                {t.unit_price ? fmt(t.unit_price) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-xs">
                                                <span className={isCredit ? 'text-green-600 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'}>
                                                    {isCredit ? '-' : '+'}{fmt(t.total_price)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-xs">
                                                <span className={t.running_total > 0 ? 'text-amber-600 dark:text-amber-400' : t.running_total < 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}>
                                                    {fmt(Math.abs(t.running_total))}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-32">{t.notes || '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
