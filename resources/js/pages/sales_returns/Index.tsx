import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus, Search, PackageX, ChevronLeft, ChevronRight,
    Eye, Pencil, Trash2, FileDown, X, RotateCcw,
    ExternalLink,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';

interface SalesReturn {
    uuid: string; return_date: string; total_amount: number;
    client: { uuid: string; nom: string };
    invoice: { uuid: string; code: string };
}
interface PaginatedData {
    data: SalesReturn[]; total: number;
    current_page: number; last_page: number; per_page: number;
}
interface Props {
    returns: PaginatedData;
    filters: { search: string; per_page: string };
}

const fmt = (n: number) => Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 });

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Retours de vente', href: '/sales_returns' }];

export default function Index() {
    const { returns, filters } = usePage().props as unknown as Props;

    const [search,     setSearch]     = useState(filters.search   || '');
    const [perPage,    setPerPage]    = useState(filters.per_page ?? '10');
    const [processing, setProcessing] = useState(false);

    const { confirmState, confirm, closeConfirm } = useConfirmDialog();

    const go = (extra: object = {}) =>
        router.get('/sales_returns',
            { search, per_page: perPage, ...extra },
            { preserveState: true, preserveScroll: true, replace: true });

    useEffect(() => {
        const t = setTimeout(() => go(), 350);
        return () => clearTimeout(t);
    }, [search, perPage]);

    const handleDelete = (uuid: string) => {
        confirm({
            title: 'Supprimer ce retour ?',
            description: 'Ce retour et ses lignes seront définitivement supprimés. Cette action est irréversible.',
            onConfirm: () => {
                setProcessing(true);
                router.delete(`/sales_returns/${uuid}`, {
                    onFinish: () => { setProcessing(false); closeConfirm(); },
                });
            },
        });
    };

    const pageTotal = returns.data.reduce((s, r) => s + Number(r.total_amount), 0);

    const from = returns.data.length > 0 ? ((returns.current_page - 1) * Number(perPage)) + 1 : 0;
    const to   = Math.min(returns.current_page * Number(perPage), returns.total);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Retours de vente" />

            <ConfirmDialog open={confirmState.open} onOpenChange={closeConfirm}
                title={confirmState.title} description={confirmState.description}
                onConfirm={confirmState.onConfirm} loading={processing} />

            <div className="flex flex-col gap-6 p-6 bg-slate-50/50 min-h-full">

                {/* ── Header ── */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                            <RotateCcw className="h-5 w-5 text-rose-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Retours de vente</h1>
                            <p className="text-sm text-slate-400 mt-0.5">Traitez les retours clients et restockez l'inventaire</p>
                        </div>
                    </div>
                    <Button size="sm" className="rounded-lg bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => router.visit('/sales_returns/create')}>
                        <Plus className="h-4 w-4 mr-1.5" /> Nouveau retour
                    </Button>
                </div>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 rounded-lg bg-slate-100">
                                <RotateCcw className="h-4 w-4 text-slate-600" />
                            </div>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total retours</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1 leading-none">{returns.total}</p>
                        <p className="text-xs text-slate-400 mt-1.5">tous les retours</p>
                    </div>

                    <div className="bg-white rounded-xl border border-rose-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 rounded-lg bg-rose-50">
                                <PackageX className="h-4 w-4 text-rose-600" />
                            </div>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Valeur (page)</p>
                        <p className="text-2xl font-bold text-rose-600 mt-1 leading-none">{fmt(pageTotal)} MAD</p>
                        <p className="text-xs text-slate-400 mt-1.5">sur la page actuelle</p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 rounded-lg bg-slate-100">
                                <PackageX className="h-4 w-4 text-slate-500" />
                            </div>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cette page</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1 leading-none">{returns.data.length}</p>
                        <p className="text-xs text-slate-400 mt-1.5">retours affichés</p>
                    </div>
                </div>

                {/* ── Table card ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Rechercher client, facture…"
                                className="pl-9 h-9 rounded-lg border-slate-200"
                                value={search} onChange={e => setSearch(e.target.value)} />
                            {search && (
                                <button onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="sm:ml-auto text-xs text-slate-400 font-medium">
                            {returns.total} retour{returns.total !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[640px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-10">#</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ID Retour</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Facture liée</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Montant</th>
                                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {returns.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <PackageX className="h-12 w-12 text-slate-200" />
                                                <p className="font-medium text-slate-400">Aucun retour trouvé</p>
                                                {search && <button onClick={() => setSearch('')} className="text-xs text-indigo-500 hover:underline">Effacer la recherche</button>}
                                            </div>
                                        </td>
                                    </tr>
                                ) : returns.data.map((ret, idx) => {
                                    const rowNum = ((returns.current_page - 1) * Number(perPage)) + idx + 1;
                                    return (
                                        <tr key={ret.uuid}
                                            className="hover:bg-rose-50/20 transition-colors cursor-pointer group"
                                            onClick={() => router.visit(`/sales_returns/${ret.uuid}`)}>

                                            <td className="px-4 py-3.5">
                                                <span className="text-xs text-slate-300 font-mono group-hover:text-rose-300">{rowNum}</span>
                                            </td>
                                            <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                                                {ret.uuid.slice(0, 8)}…
                                            </td>
                                            <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => router.visit(`/sales_invoices/${ret.invoice.uuid}`)}
                                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs hover:underline">
                                                    {ret.invoice.code}
                                                    <ExternalLink className="h-3 w-3" />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3.5 font-medium text-slate-800 text-sm">{ret.client.nom}</td>
                                            <td className="px-4 py-3.5 text-slate-500 text-xs">{ret.return_date}</td>
                                            <td className="px-4 py-3.5 text-right font-mono font-semibold text-rose-600 text-sm">
                                                {fmt(ret.total_amount)} MAD
                                            </td>
                                            <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <button title="Voir"
                                                        onClick={() => router.visit(`/sales_returns/${ret.uuid}`)}
                                                        className="h-7 w-7 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button title="Modifier"
                                                        onClick={() => router.visit(`/sales_returns/${ret.uuid}/edit`)}
                                                        className="h-7 w-7 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button title="Télécharger PDF"
                                                        onClick={() => window.open(`/sales_returns/${ret.uuid}/pdf`, '_blank')}
                                                        className="h-7 w-7 rounded-lg hover:bg-blue-50 text-blue-500 flex items-center justify-center transition-colors">
                                                        <FileDown className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button title="Supprimer"
                                                        onClick={() => handleDelete(ret.uuid)}
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
                            {returns.data.length > 0
                                ? `Affichage de ${from} à ${to} sur ${returns.total} retours`
                                : '0 retour'}
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
                                Page <span className="font-semibold text-slate-700">{returns.current_page}</span> / <span className="font-semibold text-slate-700">{returns.last_page}</span>
                            </span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                                    disabled={returns.current_page === 1}
                                    onClick={() => go({ page: returns.current_page - 1 })}>
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                                    disabled={returns.current_page === returns.last_page}
                                    onClick={() => go({ page: returns.current_page + 1 })}>
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
