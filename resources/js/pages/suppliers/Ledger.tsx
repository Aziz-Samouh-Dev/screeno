import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft, BookOpen, ShoppingBag, RotateCcw, RefreshCw, DollarSign, XCircle, CreditCard,
} from 'lucide-react';

interface Supplier { uuid: string; nom: string; email?: string; telephone: string; ville?: string; }
interface Txn {
    uuid: string; type: 'F' | 'R' | 'P'; return_type?: string | null;
    product_name: string; quantity: number;
    unit_price: number; total_price: number;
    running_total: number; notes?: string; created_at: string;
}

const dateOpts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };

export default function Ledger() {
    const { supplier, transactions, balance, filters } = usePage().props as unknown as {
        supplier: Supplier; transactions: Txn[]; balance: number; filters: { date_from: string; date_to: string };
    };
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Fournisseurs', href: '/suppliers' },
        { title: supplier.nom, href: `/suppliers/${supplier.uuid}` },
        { title: 'Grand livre', href: `/suppliers/${supplier.uuid}/ledger` },
    ];

    const applyFilters = () => {
        router.get(`/suppliers/${supplier.uuid}/ledger`, { date_from: dateFrom, date_to: dateTo },
            { preserveState: true, replace: true });
    };

    const fmt = (n: number) => Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 });

    const typeIcon = (t: Txn) => {
        if (t.type === 'F') return { icon: ShoppingBag, bg: 'bg-blue-100 dark:bg-blue-950/30', color: 'text-blue-600 dark:text-blue-400', label: 'Achat' };
        if (t.type === 'P') return { icon: CreditCard, bg: 'bg-green-100 dark:bg-green-950/30', color: 'text-green-600 dark:text-green-400', label: 'Paiement' };
        if (t.return_type === 'change') return { icon: RefreshCw, bg: 'bg-blue-100 dark:bg-blue-950/30', color: 'text-blue-600 dark:text-blue-400', label: 'Échange' };
        if (t.return_type === 'refund') return { icon: DollarSign, bg: 'bg-emerald-100 dark:bg-emerald-950/30', color: 'text-emerald-600 dark:text-emerald-400', label: 'Remboursement' };
        return { icon: XCircle, bg: 'bg-red-100 dark:bg-red-950/30', color: 'text-red-600 dark:text-red-400', label: 'Perte' };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Grand livre — ${supplier.nom}`} />
            <div className="flex flex-col gap-6 p-6 max-w-5xl">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Grand livre — {supplier.nom}</h1>
                        <p className="text-sm text-muted-foreground">{supplier.email && `${supplier.email} · `}{supplier.telephone}</p>
                    </div>
                </div>

                {/* Balance card */}
                <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Solde actuel</p>
                        <p className={`text-3xl font-bold font-mono mt-1 ${
                            balance > 0.005 ? 'text-amber-600 dark:text-amber-400' :
                            balance < -0.005 ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>{fmt(balance)} MAD</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <Input type="date" value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            className="h-8 w-36 rounded-lg" />
                        <span className="text-muted-foreground">→</span>
                        <Input type="date" value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            className="h-8 w-36 rounded-lg" />
                        <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={applyFilters}>
                            Filtrer
                        </Button>
                    </div>
                </div>

                {/* Transactions */}
                <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-border/60 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-foreground">Historique</h3>
                        <span className="ml-auto text-xs text-muted-foreground">{transactions.length} transaction(s)</span>
                    </div>

                    {transactions.length > 0 ? (
                        <div className="divide-y divide-border/60">
                            {transactions.map((t) => {
                                const ti = typeIcon(t);
                                const Icon = ti.icon;
                                return (
                                    <div key={t.uuid} className="px-5 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                                        <div className={`p-1.5 rounded-lg shrink-0 ${ti.bg}`}>
                                            <Icon className={`h-3.5 w-3.5 ${ti.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400">
                                                    {ti.label}
                                                </span>
                                                <span className="text-sm font-medium text-foreground">{t.product_name || '—'}</span>
                                                {t.quantity && <span className="text-xs text-muted-foreground">x{t.quantity}</span>}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                {new Date(t.created_at).toLocaleDateString('fr-FR', dateOpts)}
                                                {t.notes && ` — ${t.notes}`}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`font-mono font-bold text-sm ${
                                                t.type === 'F' ? 'text-amber-600 dark:text-amber-400' :
                                                t.type === 'P' || t.return_type === 'refund' ? 'text-emerald-600 dark:text-emerald-400' :
                                                'text-muted-foreground'
                                            }`}>
                                                {t.type === 'F' ? '+' : t.type === 'P' || t.return_type === 'refund' ? '-' : ''}
                                                {fmt(t.total_price)} MAD
                                            </p>
                                            <p className="text-[11px] text-muted-foreground font-mono">
                                                Solde: {fmt(t.running_total)} MAD
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                            <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            Aucune transaction trouvée
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
