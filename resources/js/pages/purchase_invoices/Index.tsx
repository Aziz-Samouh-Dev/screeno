import { useState, useEffect, ReactNode } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus, Search, ShoppingCart, TrendingDown, AlertCircle, CheckCircle2,
    ChevronLeft, ChevronRight, Eye, Pencil, Trash2, FileDown,
    X, SlidersHorizontal, Receipt,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';

interface PurchaseInvoice {
    uuid: string; code: string; invoice_date: string;
    total_amount: number; paid_amount: number; remaining_amount: number;
    status: 'paid' | 'partial' | 'unpaid';
    supplier: { uuid: string; nom: string };
}
interface PaginatedData {
    data: PurchaseInvoice[]; total: ReactNode;
    current_page: number; last_page: number; per_page: number;
}
interface Props {
    purchaseInvoices: PaginatedData;
    filters: { search: string; status: string; per_page: string };
}

function statusBadge(s: string) {
    if (s === 'paid')    return { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Payée'     };
    if (s === 'partial') return { cls: 'bg-amber-50  text-amber-700  border-amber-200',    dot: 'bg-amber-500',  label: 'Partielle' };
    return                     { cls: 'bg-red-50    text-red-700    border-red-200',        dot: 'bg-red-500',    label: 'Impayée'   };
}

const fmt = (n: number) => Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 });

const breadcrumbs: BreadcrumbItem[] = [{ title: "Factures d'achat", href: '/purchase_invoices' }];

export default function Index() {
    const { purchaseInvoices, filters } = usePage().props as unknown as Props;

    const [search,     setSearch]     = useState(filters.search  || '');
    const [status,     setStatus]     = useState(filters.status  || 'all');
    const [perPage,    setPerPage]    = useState(filters.per_page ?? '10');
    const [processing, setProcessing] = useState(false);

    const { confirmState, confirm, closeConfirm } = useConfirmDialog();

    const go = (extra: object = {}) =>
        router.get('/purchase_invoices',
            { search, status: status === 'all' ? undefined : status, per_page: perPage, ...extra },
            { preserveState: true, preserveScroll: true, replace: true });

    useEffect(() => {
        const t = setTimeout(() => go(), 350);
        return () => clearTimeout(t);
    }, [search, status, perPage]);

    const handleDelete = (uuid: string, code: string) => {
        confirm({
            title: 'Supprimer cette facture ?',
            description: `La facture « ${code} » sera définitivement supprimée. Cette action est irréversible.`,
            onConfirm: () => {
                setProcessing(true);
                router.delete(`/purchase_invoices/${uuid}`, {
                    onFinish: () => { setProcessing(false); closeConfirm(); },
                });
            },
        });
    };

    const pageTotal   = purchaseInvoices.data.reduce((s, i) => s + Number(i.total_amount), 0);
    const pagePaid    = purchaseInvoices.data.reduce((s, i) => s + Number(i.paid_amount), 0);
    const pageBalance = purchaseInvoices.data.reduce((s, i) => s + Number(i.remaining_amount), 0);
    const unpaidCount = purchaseInvoices.data.filter(i => i.status !== 'paid').length;

    const from = purchaseInvoices.data.length > 0 ? ((purchaseInvoices.current_page - 1) * Number(perPage)) + 1 : 0;
    const to   = Math.min(purchaseInvoices.current_page * Number(perPage), Number(purchaseInvoices.total));

    const statCards = [
        { label: 'Total (page)',   value: `${fmt(pageTotal)} MAD`,    icon: ShoppingCart,  bg: 'bg-violet-50',  ic: 'text-violet-600', border: 'border-violet-100' },
        { label: 'Payé (page)',    value: `${fmt(pagePaid)} MAD`,     icon: CheckCircle2,  bg: 'bg-emerald-50', ic: 'text-emerald-600',border: 'border-emerald-100'},
        { label: 'En attente',     value: `${fmt(pageBalance)} MAD`,  icon: TrendingDown,  bg: 'bg-red-50',     ic: 'text-red-600',    border: 'border-red-100'    },
        { label: 'Non soldées',    value: `${unpaidCount} facture${unpaidCount !== 1 ? 's' : ''}`, icon: AlertCircle, bg: 'bg-amber-50', ic: 'text-amber-600', border: 'border-amber-100' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Factures d'achat" />

            <ConfirmDialog open={confirmState.open} onOpenChange={closeConfirm}
                title={confirmState.title} description={confirmState.description}
                onConfirm={confirmState.onConfirm} loading={processing} />

            <div className="flex flex-col gap-6 p-6 bg-slate-50/50 min-h-full">

                {/* ── Header ── */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100">
                            <Receipt className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Factures d'achat</h1>
                            <p className="text-sm text-slate-400 mt-0.5">Suivez les factures fournisseurs entrantes</p>
                        </div>
                    </div>
                    <Button size="sm" className="rounded-lg bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => router.visit('/purchase_invoices/create')}>
                        <Plus className="h-4 w-4 mr-1.5" /> Nouvelle facture
                    </Button>
                </div>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map(c => (
                        <div key={c.label} className={`bg-white rounded-xl border shadow-sm p-5 ${c.border}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2 rounded-lg ${c.bg}`}>
                                    <c.icon className={`h-4 w-4 ${c.ic}`} />
                                </div>
                            </div>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{c.label}</p>
                            <p className="text-lg font-bold text-slate-900 mt-1 leading-none">{c.value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Table card ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Rechercher fournisseur ou code…"
                                className="pl-9 h-9 rounded-lg border-slate-200"
                                value={search} onChange={e => setSearch(e.target.value)} />
                            {search && (
                                <button onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
                            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="border-0 p-0 h-auto text-xs font-medium text-slate-700 shadow-none focus:ring-0 w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    <SelectItem value="paid">Payée</SelectItem>
                                    <SelectItem value="partial">Partielle</SelectItem>
                                    <SelectItem value="unpaid">Impayée</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="sm:ml-auto text-xs text-slate-400 font-medium">
                            {purchaseInvoices.total} facture{Number(purchaseInvoices.total) !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[760px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-10">#</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fournisseur</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Payé</th>
                                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Solde</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {purchaseInvoices.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <ShoppingCart className="h-12 w-12 text-slate-200" />
                                                <p className="font-medium text-slate-400">Aucune facture trouvée</p>
                                                {search && <button onClick={() => setSearch('')} className="text-xs text-indigo-500 hover:underline">Effacer la recherche</button>}
                                            </div>
                                        </td>
                                    </tr>
                                ) : purchaseInvoices.data.map((inv, idx) => {
                                    const rowNum = ((purchaseInvoices.current_page - 1) * Number(perPage)) + idx + 1;
                                    const sb = statusBadge(inv.status);
                                    return (
                                        <tr key={inv.uuid}
                                            className="hover:bg-violet-50/20 transition-colors cursor-pointer group"
                                            onClick={() => router.visit(`/purchase_invoices/${inv.uuid}`)}>

                                            <td className="px-4 py-3.5">
                                                <span className="text-xs text-slate-300 font-mono group-hover:text-violet-300">{rowNum}</span>
                                            </td>
                                            <td className="px-4 py-3.5 font-mono font-semibold text-slate-700 text-xs">{inv.code}</td>
                                            <td className="px-4 py-3.5 font-medium text-slate-800 text-sm">{inv.supplier?.nom}</td>
                                            <td className="px-4 py-3.5 text-slate-500 text-xs">{inv.invoice_date}</td>
                                            <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-700">{fmt(inv.total_amount)}</td>
                                            <td className="px-4 py-3.5 text-right font-mono text-xs text-emerald-600">{fmt(inv.paid_amount)}</td>
                                            <td className="px-4 py-3.5 text-right font-mono text-xs text-amber-600">{fmt(inv.remaining_amount)}</td>
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${sb.cls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${sb.dot}`} />{sb.label}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <button title="Voir"
                                                        onClick={() => router.visit(`/purchase_invoices/${inv.uuid}`)}
                                                        className="h-7 w-7 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button title="Modifier"
                                                        onClick={() => router.visit(`/purchase_invoices/${inv.uuid}/edit`)}
                                                        className="h-7 w-7 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button title="Télécharger PDF"
                                                        onClick={() => window.open(`/purchase_invoices/${inv.uuid}/pdf`, '_blank')}
                                                        className="h-7 w-7 rounded-lg hover:bg-blue-50 text-blue-500 flex items-center justify-center transition-colors">
                                                        <FileDown className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button title="Supprimer"
                                                        onClick={() => handleDelete(inv.uuid, inv.code)}
                                                        className="h-7 w-7 rounded-lg hover:bg-red-50 text-red-400 flex items-center justify-center transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="text-xs text-slate-500">
                            {purchaseInvoices.data.length > 0
                                ? `Affichage de ${from} à ${to} sur ${purchaseInvoices.total} factures`
                                : '0 facture'}
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-400">Lignes</span>
                                <Select value={perPage} onValueChange={v => { setPerPage(v); go({ per_page: v, page: 1 }); }}>
                                    <SelectTrigger className="h-7 w-16 text-xs rounded-lg border-slate-200 bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>{['5','10','25','50'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <span className="text-xs text-slate-500">
                                Page <span className="font-semibold text-slate-700">{purchaseInvoices.current_page}</span> / <span className="font-semibold text-slate-700">{purchaseInvoices.last_page}</span>
                            </span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                                    disabled={purchaseInvoices.current_page === 1}
                                    onClick={() => go({ page: purchaseInvoices.current_page - 1 })}>
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                                    disabled={purchaseInvoices.current_page === purchaseInvoices.last_page}
                                    onClick={() => go({ page: purchaseInvoices.current_page + 1 })}>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
