import { useState, useEffect, ReactNode } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    ChevronLeft, ChevronRight, Plus, Truck, UserCheck, UserX,
    Search, ArrowUpDown, Trash2, Download, Pencil,
    SlidersHorizontal, X, Phone, MapPin,
    ShoppingBag, RotateCcw, BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Fournisseurs', href: '/suppliers' }];

interface Supplier {
    uuid: string; nom: string; email: string;
    telephone: string | null; ville: string | null;
    status: 'active' | 'inactive';
    balance: number;
}
interface PaginatedData {
    total: ReactNode; data: Supplier[];
    current_page: number; last_page: number; per_page: number;
}
interface Props {
    suppliers: PaginatedData;
    globalStats: { totalSuppliers: number; activeSuppliers: number; inactiveSuppliers: number };
    filters: { search?: string; status?: string; sort?: string; per_page?: string };
}

const initials = (n: string) => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

export default function Index() {
    const { suppliers, filters, globalStats } = usePage().props as unknown as Props;

    const [search,     setSearch]     = useState(filters.search  || '');
    const [status,     setStatus]     = useState(filters.status  || 'all');
    const [sort,       setSort]       = useState(filters.sort    || '');
    const [perPage,    setPerPage]    = useState(filters.per_page || '10');
    const [processing, setProcessing] = useState(false);

    const { confirmState, confirm, closeConfirm } = useConfirmDialog();

    const go = (extra: object = {}) =>
        router.get('/suppliers',
            { search, status: status === 'all' ? undefined : status, sort, per_page: perPage, ...extra },
            { preserveState: true, preserveScroll: true, replace: true });

    const handleSort = (field: string) => {
        const dir = sort === `${field}_asc` ? 'desc' : 'asc';
        const s = `${field}_${dir}`; setSort(s); go({ sort: s });
    };

    useEffect(() => {
        const t = setTimeout(() => go(), 350);
        return () => clearTimeout(t);
    }, [search, status, perPage]);

    const handleDelete = (uuid: string, nom: string) => {
        confirm({
            title: 'Supprimer ce fournisseur ?',
            description: `« ${nom} » sera définitivement supprimé.`,
            onConfirm: () => {
                setProcessing(true);
                router.delete(`/suppliers/${uuid}`, {
                    onFinish: () => { setProcessing(false); closeConfirm(); },
                });
            },
        });
    };

    const SortBtn = ({ field, label }: { field: string; label: string }) => (
        <button type="button" className="flex items-center gap-1 group" onClick={() => handleSort(field)}>
            {label}
            <ArrowUpDown className={`h-3 w-3 transition-opacity ${sort.startsWith(field) ? 'opacity-100 text-indigo-500' : 'opacity-30 group-hover:opacity-60'}`} />
        </button>
    );

    const total       = globalStats.totalSuppliers;
    const active      = globalStats.activeSuppliers;
    const inactive    = globalStats.inactiveSuppliers;
    const activePct   = total > 0 ? Math.round((active   / total) * 100) : 0;
    const inactivePct = total > 0 ? Math.round((inactive / total) * 100) : 0;

    const from = suppliers.data.length > 0 ? ((suppliers.current_page - 1) * Number(perPage)) + 1 : 0;
    const to   = Math.min(suppliers.current_page * Number(perPage), Number(suppliers.total));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fournisseurs" />

            <ConfirmDialog open={confirmState.open} onOpenChange={closeConfirm}
                title={confirmState.title} description={confirmState.description}
                onConfirm={confirmState.onConfirm} loading={processing} />

            <div className="flex flex-col gap-6 p-6">

                {/* ── Header ── */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
                            <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Fournisseurs</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">Gérez vos partenaires fournisseurs</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-lg"
                            onClick={() => window.open('/suppliers/export/csv', '_blank')}>
                            <Download className="h-4 w-4 mr-1.5" /> Exporter CSV
                        </Button>
                        <Link href="/suppliers/create">
                            <Button size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-1.5" /> Nouveau fournisseur
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-card rounded-xl border border-border shadow-sm p-5">
                        <div className="p-2 rounded-lg bg-muted w-fit mb-3">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total fournisseurs</p>
                        <p className="text-3xl font-bold text-foreground mt-1 leading-none">{total}</p>
                    </div>
                    <div className="bg-card rounded-xl border border-emerald-100 dark:border-emerald-900 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                                <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">{activePct}%</span>
                        </div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actifs</p>
                        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 leading-none">{active}</p>
                        <div className="mt-3 h-1.5 bg-emerald-100 dark:bg-emerald-950/40 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${activePct}%` }} />
                        </div>
                    </div>
                    <div className="bg-card rounded-xl border border-red-100 dark:border-red-900 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                                <UserX className="h-4 w-4 text-red-500 dark:text-red-400" />
                            </div>
                            <span className="text-xs font-semibold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">{inactivePct}%</span>
                        </div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Inactifs</p>
                        <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1 leading-none">{inactive}</p>
                        <div className="mt-3 h-1.5 bg-red-100 dark:bg-red-950/40 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400 rounded-full" style={{ width: `${inactivePct}%` }} />
                        </div>
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="px-5 py-3.5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Rechercher nom, email ou téléphone…"
                                className="pl-9 h-9 rounded-lg border-border"
                                value={search} onChange={e => setSearch(e.target.value)} />
                            {search && (
                                <button onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 border border-border rounded-lg px-2.5 py-1.5 bg-card">
                            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="border-0 p-0 h-auto text-xs font-medium text-foreground shadow-none focus:ring-0 w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    <SelectItem value="active">Actifs seulement</SelectItem>
                                    <SelectItem value="inactive">Inactifs seulement</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="sm:ml-auto text-xs text-muted-foreground font-medium">
                            {suppliers.total} fournisseur{Number(suppliers.total) !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-175">
                            <thead className="bg-muted/40 border-b border-border/60">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-10">#</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        <SortBtn field="nom" label="Fournisseur" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Téléphone</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ville</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Solde / Statut</th>
                                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {suppliers.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Truck className="h-12 w-12 text-muted-foreground/20" />
                                                <p className="font-medium text-muted-foreground">Aucun fournisseur trouvé</p>
                                                {search
                                                    ? <button onClick={() => setSearch('')} className="text-xs text-blue-500 hover:underline">Effacer la recherche</button>
                                                    : <Link href="/suppliers/create"><span className="text-xs text-blue-500 hover:underline">Ajouter votre premier fournisseur →</span></Link>
                                                }
                                            </div>
                                        </td>
                                    </tr>
                                ) : suppliers.data.map((s, idx) => {
                                    const rowNum = ((suppliers.current_page - 1) * Number(perPage)) + idx + 1;
                                    return (
                                        <tr key={s.uuid}
                                            className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors cursor-pointer group"
                                            onClick={() => router.visit(`/suppliers/${s.uuid}`)}>

                                            <td className="px-4 py-3.5">
                                                <span className="text-xs text-muted-foreground/40 font-mono group-hover:text-blue-400">{rowNum}</span>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                                                        {initials(s.nom)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors text-sm">{s.nom}</p>
                                                        <p className="text-xs text-muted-foreground">{s.email || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                {s.telephone
                                                    ? <div className="flex items-center gap-1.5 text-foreground/70 text-xs"><Phone className="h-3 w-3 text-muted-foreground" />{s.telephone}</div>
                                                    : <span className="text-muted-foreground/40">—</span>}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                {s.ville
                                                    ? <div className="flex items-center gap-1.5 text-foreground/70 text-xs"><MapPin className="h-3 w-3 text-muted-foreground" />{s.ville}</div>
                                                    : <span className="text-muted-foreground/40">—</span>}
                                            </td>

                                            {/* Balance column */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-col gap-0.5">
                                                    {s.balance > 0.005 ? (
                                                        <>
                                                            <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                                                                {Number(s.balance).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD
                                                            </span>
                                                            <span className="text-[10px] text-amber-500 font-medium">à payer</span>
                                                        </>
                                                    ) : s.balance < -0.005 ? (
                                                        <>
                                                            <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                                                                {Number(Math.abs(s.balance)).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD
                                                            </span>
                                                            <span className="text-[10px] text-blue-500 font-medium">avoir fournisseur</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">0,00 MAD</span>
                                                            <span className="text-[10px] text-emerald-500 font-medium">soldé</span>
                                                        </>
                                                    )}
                                                    {s.status === 'inactive' && (
                                                        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground bg-muted border border-border/60 w-fit mt-0.5">
                                                            Inactif
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <button title="Achat"
                                                        onClick={() => router.visit(`/suppliers/${s.uuid}/purchase`)}
                                                        className="h-7 w-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors">
                                                        <ShoppingBag className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button title="Retour"
                                                        onClick={() => router.visit(`/suppliers/${s.uuid}/return`)}
                                                        className="h-7 w-7 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors">
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button title="Grand livre"
                                                        onClick={() => router.visit(`/suppliers/${s.uuid}/ledger`)}
                                                        className="h-7 w-7 rounded-lg bg-muted hover:bg-accent text-muted-foreground flex items-center justify-center transition-colors">
                                                        <BookOpen className="h-3.5 w-3.5" />
                                                    </button>
                                                    <div className="w-px h-4 bg-border mx-0.5" />
                                                    <button title="Modifier"
                                                        onClick={() => router.visit(`/suppliers/${s.uuid}/edit`)}
                                                        className="h-7 w-7 rounded-lg hover:bg-accent text-muted-foreground flex items-center justify-center transition-colors">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button title="Supprimer"
                                                        onClick={() => handleDelete(s.uuid, s.nom)}
                                                        className="h-7 w-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-400 flex items-center justify-center transition-colors">
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
                    <div className="px-5 py-3.5 border-t border-border/60 bg-muted/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                            {suppliers.data.length > 0
                                ? `Affichage de ${from} à ${to} sur ${suppliers.total} fournisseurs`
                                : '0 fournisseur'}
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">Lignes</span>
                                <Select value={perPage} onValueChange={v => { setPerPage(v); go({ per_page: v, page: 1 }); }}>
                                    <SelectTrigger className="h-7 w-16 text-xs rounded-lg border-border bg-card"><SelectValue /></SelectTrigger>
                                    <SelectContent>{['5','10','25','50'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                Page <span className="font-semibold text-foreground">{suppliers.current_page}</span> / <span className="font-semibold text-foreground">{suppliers.last_page}</span>
                            </span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                                    disabled={suppliers.current_page === 1}
                                    onClick={() => go({ page: suppliers.current_page - 1 })}>
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                                    disabled={suppliers.current_page === suppliers.last_page}
                                    onClick={() => go({ page: suppliers.current_page + 1 })}>
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
