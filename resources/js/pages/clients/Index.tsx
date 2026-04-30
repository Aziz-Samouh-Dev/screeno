import { useState, useEffect, ReactNode } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    ChevronRight, ChevronLeft, Plus, Users, UserCheck, UserX,
    Search, ArrowUpDown, Trash2, Download, Pencil, X,
    CreditCard, History, SlidersHorizontal,
    ShoppingCart, RotateCcw, BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Clients', href: '/clients' }];

interface Client {
    uuid: string; nom: string; email?: string | null;
    telephone: string; ville?: string | null; status: 'active' | 'inactive';
}
interface PaginatedData {
    total: ReactNode; data: Client[];
    current_page: number; last_page: number; per_page: number; from: number; to: number;
}
interface Props {
    clients: PaginatedData;
    globalStats: { totalClients: number; activeClients: number; inactiveClients: number };
    filters: { search?: string; status?: string; sort?: string; per_page?: string };
}

const COLORS = [
    'bg-indigo-100 text-indigo-700', 'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700',
];
const initials  = (n: string) => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
const avatarClr = (n: string) => COLORS[n.charCodeAt(0) % COLORS.length];

function DonutChart({ active, inactive }: { active: number; inactive: number }) {
    const total = active + inactive || 1;
    const pct   = active / total;
    const r = 28, cx = 36, cy = 36, sw = 8;
    const circ = 2 * Math.PI * r;
    return (
        <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={sw} />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#10b981" strokeWidth={sw}
                strokeDasharray={`${pct * circ} ${circ}`} strokeDashoffset={circ / 4}
                strokeLinecap="round" />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">
                {Math.round(pct * 100)}%
            </text>
        </svg>
    );
}

export default function Index() {
    const { clients, filters, globalStats } = usePage().props as unknown as Props;

    const [search,  setSearch]  = useState(filters.search  || '');
    const [status,  setStatus]  = useState(filters.status  || 'all');
    const [sort,    setSort]    = useState(filters.sort     || '');
    const [perPage, setPerPage] = useState(filters.per_page || '10');
    const [processing, setProcessing] = useState(false);

    const { confirmState, confirm, closeConfirm } = useConfirmDialog();

    const [paymentModal,      setPaymentModal]      = useState<{ uuid: string; nom: string } | null>(null);
    const [paymentAmount,     setPaymentAmount]     = useState('');
    const [paymentNotes,      setPaymentNotes]      = useState('');
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    const openPayment = (c: Client) => {
        setPaymentModal({ uuid: c.uuid, nom: c.nom });
        setPaymentAmount(''); setPaymentNotes('');
    };
    const submitPayment = () => {
        if (!paymentModal || !paymentAmount) return;
        setPaymentProcessing(true);
        router.post(`/clients/${paymentModal.uuid}/payment`,
            { amount: parseFloat(paymentAmount), notes: paymentNotes },
            { onSuccess: () => { setPaymentModal(null); setPaymentProcessing(false); },
              onError:   () => setPaymentProcessing(false) });
    };

    const go = (extra: object = {}) =>
        router.get('/clients',
            { search, status: status === 'all' ? undefined : status, sort, per_page: perPage, ...extra },
            { preserveState: true, preserveScroll: true, replace: true });

    const handleSort = (field: string) => {
        const dir = sort === `${field}_asc` ? 'desc' : 'asc';
        setSort(`${field}_${dir}`);
        go({ sort: `${field}_${dir}` });
    };

    useEffect(() => {
        const t = setTimeout(() => go(), 350);
        return () => clearTimeout(t);
    }, [search, status, perPage]);

    const handleDelete = (uuid: string, nom: string) => {
        confirm({
            title: 'Supprimer ce client ?',
            description: `« ${nom} » et toutes ses données seront supprimés définitivement.`,
            onConfirm: () => {
                setProcessing(true);
                router.delete(`/clients/${uuid}`, {
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

    const active      = globalStats.activeClients;
    const inactive    = globalStats.inactiveClients;
    const total       = globalStats.totalClients;
    const activePct   = total > 0 ? Math.round((active / total) * 100) : 0;
    const inactivePct = total > 0 ? Math.round((inactive / total) * 100) : 0;

    const from = clients.data.length > 0 ? ((clients.current_page - 1) * Number(perPage)) + 1 : 0;
    const to   = Math.min(clients.current_page * Number(perPage), Number(clients.total));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />

            {/* Payment modal */}
            {paymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={() => setPaymentModal(null)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-emerald-50">
                                    <CreditCard className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900 text-sm">Enregistrer un paiement</h2>
                                    <p className="text-xs text-slate-400">{paymentModal.nom}</p>
                                </div>
                            </div>
                            <button onClick={() => setPaymentModal(null)} className="rounded-lg p-1.5 hover:bg-slate-100">
                                <X className="h-4 w-4 text-slate-400" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Montant *</label>
                                <Input type="number" step="0.01" min="0.01" placeholder="0.00"
                                    value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                                    className="h-10 rounded-lg text-right font-mono" autoFocus />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Notes (optionnel)</label>
                                <textarea value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)}
                                    rows={2} placeholder="Référence, mode de paiement…"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setPaymentModal(null)}>Annuler</Button>
                            <Button className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                disabled={!paymentAmount || paymentProcessing} onClick={submitPayment}>
                                <CreditCard className="h-4 w-4 mr-1.5" />
                                {paymentProcessing ? 'En cours…' : 'Confirmer'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog open={confirmState.open} onOpenChange={closeConfirm}
                title={confirmState.title} description={confirmState.description}
                onConfirm={confirmState.onConfirm} loading={processing} />

            <div className="flex flex-col gap-6 p-6 bg-slate-50/50 min-h-full">

                {/* ── Header ── */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                            <Users className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Clients</h1>
                            <p className="text-sm text-slate-400 mt-0.5">Gérez votre portefeuille clients</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-lg"
                            onClick={() => window.open('/clients/export/csv', '_blank')}>
                            <Download className="h-4 w-4 mr-1.5" /> Exporter CSV
                        </Button>
                        <Link href="/clients/create">
                            <Button size="sm" className="rounded-lg bg-indigo-600 hover:bg-indigo-700">
                                <Plus className="h-4 w-4 mr-1.5" /> Nouveau client
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                        <div className="flex-1">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total clients</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1 leading-none">{total}</p>
                            <p className="text-xs text-slate-400 mt-1.5">portefeuille complet</p>
                        </div>
                        <DonutChart active={active} inactive={inactive} />
                    </div>

                    <div className="bg-white rounded-xl border border-emerald-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 rounded-lg bg-emerald-50">
                                <UserCheck className="h-4 w-4 text-emerald-600" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{activePct}%</span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Clients actifs</p>
                        <p className="text-3xl font-bold text-emerald-700 mt-1 leading-none">{active}</p>
                        <div className="mt-3 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${activePct}%` }} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-red-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 rounded-lg bg-red-50">
                                <UserX className="h-4 w-4 text-red-500" />
                            </div>
                            <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{inactivePct}%</span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Clients inactifs</p>
                        <p className="text-3xl font-bold text-red-600 mt-1 leading-none">{inactive}</p>
                        <div className="mt-3 h-1.5 bg-red-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${inactivePct}%` }} />
                        </div>
                    </div>
                </div>

                {/* ── Table card ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Rechercher nom, email ou téléphone…"
                                className="pl-9 h-9 rounded-lg border-slate-200"
                                value={search} onChange={e => setSearch(e.target.value)} />
                            {search && (
                                <button onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
                                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="border-0 p-0 h-auto text-xs font-medium text-slate-700 shadow-none focus:ring-0 w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les statuts</SelectItem>
                                        <SelectItem value="active">Actifs seulement</SelectItem>
                                        <SelectItem value="inactive">Inactifs seulement</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="sm:ml-auto text-xs text-slate-400 font-medium">
                            {clients.total} client{Number(clients.total) !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[700px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-10">#</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                        <SortBtn field="name" label="Client" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Téléphone</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                        <SortBtn field="city" label="Ville" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                        <SortBtn field="status" label="Statut" />
                                    </th>
                                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {clients.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-300">
                                                <Users className="h-12 w-12 opacity-30" />
                                                <p className="font-medium text-slate-400">Aucun client trouvé</p>
                                                {search
                                                    ? <button onClick={() => setSearch('')} className="text-xs text-indigo-500 hover:underline">Effacer la recherche</button>
                                                    : <Link href="/clients/create"><span className="text-xs text-indigo-500 hover:underline">Ajouter votre premier client →</span></Link>
                                                }
                                            </div>
                                        </td>
                                    </tr>
                                ) : clients.data.map((c, idx) => {
                                    const rowNum = ((clients.current_page - 1) * Number(perPage)) + idx + 1;
                                    return (
                                        <tr key={c.uuid}
                                            className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                                            onClick={() => router.visit(`/clients/${c.uuid}`)}>

                                            <td className="px-4 py-3.5">
                                                <span className="text-xs text-slate-300 font-mono group-hover:text-indigo-300">{rowNum}</span>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${avatarClr(c.nom)}`}>
                                                        {initials(c.nom)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors text-sm">{c.nom}</p>
                                                        <p className="text-xs text-slate-400">{c.email || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">{c.telephone || '—'}</td>
                                            <td className="px-4 py-3.5 text-slate-600 text-xs">{c.ville || '—'}</td>

                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                                                    c.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-red-50 text-red-600 border-red-200'
                                                }`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${c.status === 'active' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                                                    {c.status === 'active' ? 'Actif' : 'Inactif'}
                                                </span>
                                            </td>

                                            <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <button title="Vente"
                                                        onClick={() => router.visit(`/clients/${c.uuid}/sell`)}
                                                        className="h-7 w-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors">
                                                        <ShoppingCart className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button title="Retour"
                                                        onClick={() => router.visit(`/clients/${c.uuid}/return`)}
                                                        className="h-7 w-7 rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-colors">
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button title="Paiement"
                                                        onClick={() => openPayment(c)}
                                                        className="h-7 w-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors">
                                                        <CreditCard className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button title="Grand livre"
                                                        onClick={() => router.visit(`/clients/${c.uuid}/ledger`)}
                                                        className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors">
                                                        <BookOpen className="h-3.5 w-3.5" />
                                                    </button>
                                                    <div className="w-px h-4 bg-slate-200 mx-0.5" />
                                                    <button title="Modifier"
                                                        onClick={() => router.visit(`/clients/${c.uuid}/edit`)}
                                                        className="h-7 w-7 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button title="Supprimer"
                                                        onClick={() => handleDelete(c.uuid, c.nom)}
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
                            {clients.data.length > 0
                                ? `Affichage de ${from} à ${to} sur ${clients.total} clients`
                                : '0 client'}
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
                                Page <span className="font-semibold text-slate-700">{clients.current_page}</span> / <span className="font-semibold text-slate-700">{clients.last_page}</span>
                            </span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                                    disabled={clients.current_page === 1}
                                    onClick={() => go({ page: clients.current_page - 1 })}>
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                                    disabled={clients.current_page === clients.last_page}
                                    onClick={() => go({ page: clients.current_page + 1 })}>
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
