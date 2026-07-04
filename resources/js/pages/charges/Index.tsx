import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    Plus, Pencil, Trash2, Download, Search,
    Building2, Users, Zap, Truck, FileText, Shield, Wifi, MoreHorizontal,
    AlertCircle, X,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Charges', href: '/charges' }];

interface Charge {
    uuid: string; category: string; description: string; amount: number;
    date: string; date_display: string; recurrence: string;
    payment_method: string | null; status: string; notes: string | null;
}
interface Stats {
    total_mois: number; loyer_mois: number; salaires_mois: number;
    a_payer: number; a_payer_count: number;
}

const CATEGORIES = [
    { value: 'loyer',      label: 'Loyer',      icon: Building2, color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { value: 'salaires',   label: 'Salaires',   icon: Users,     color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/40' },
    { value: 'energie',    label: 'Énergie',    icon: Zap,       color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/40' },
    { value: 'transport',  label: 'Transport',  icon: Truck,     color: 'text-cyan-500',   bg: 'bg-cyan-50 dark:bg-cyan-950/40' },
    { value: 'taxes',      label: 'Taxes',      icon: FileText,  color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-950/40' },
    { value: 'assurance',  label: 'Assurance',  icon: Shield,    color: 'text-emerald-500',bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { value: 'telecom',    label: 'Télécom',    icon: Wifi,      color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
    { value: 'autre',      label: 'Autre',      icon: MoreHorizontal, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/40' },
];

const RECURRENCES = [
    { value: 'ponctuelle',    label: 'Ponctuel' },
    { value: 'mensuelle',     label: 'Mensuel' },
    { value: 'trimestrielle', label: 'Trimestriel' },
    { value: 'annuelle',      label: 'Annuel' },
];

const PAYMENT_METHODS = ['Virement', 'Espèces', 'Chèque', 'Carte'];

const fmt = (n: number) =>
    Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD';

function catMeta(cat: string) {
    return CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1];
}

function CatBadge({ cat }: { cat: string }) {
    const m = catMeta(cat);
    const Icon = m.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${m.bg} ${m.color}`}>
            <Icon className="w-3 h-3" /> {m.label}
        </span>
    );
}

const emptyForm = () => ({
    category: 'loyer', description: '', amount: '', date: new Date().toISOString().slice(0, 10),
    recurrence: 'ponctuelle', payment_method: 'Virement', status: 'a_payer', notes: '',
});

export default function ChargesIndex() {
    const { charges, stats, filters } = usePage().props as unknown as {
        charges: Charge[]; stats: Stats; filters: { search: string; category: string };
    };
    const { props } = usePage<{ errors?: Record<string, string> }>();

    const [search,   setSearch]   = useState(filters.search   || '');
    const [category, setCategory] = useState(filters.category || 'all');
    const [modal,    setModal]    = useState<'create' | 'edit' | null>(null);
    const [editing,  setEditing]  = useState<Charge | null>(null);
    const [form,     setForm]     = useState(emptyForm());
    const [processing, setProcessing] = useState(false);

    const { confirmState, confirm, closeConfirm } = useConfirmDialog();

    // Open modal from URL param (from finances page link)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('modal') === 'new') { openCreate(); }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
            router.get('/charges', { search, category: category === 'all' ? undefined : category },
                { preserveState: true, preserveScroll: true, replace: true });
        }, 350);
        return () => clearTimeout(t);
    }, [search, category]);

    function openCreate() {
        setForm(emptyForm());
        setEditing(null);
        setModal('create');
    }

    function openEdit(c: Charge) {
        setForm({
            category: c.category, description: c.description,
            amount: String(c.amount), date: c.date,
            recurrence: c.recurrence, payment_method: c.payment_method ?? 'Virement',
            status: c.status, notes: c.notes ?? '',
        });
        setEditing(c);
        setModal('edit');
    }

    function closeModal() { setModal(null); setEditing(null); }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        const payload = { ...form, amount: parseFloat(form.amount) || 0 };

        if (modal === 'create') {
            router.post('/charges', payload, {
                onSuccess: () => closeModal(),
                onFinish:  () => setProcessing(false),
            });
        } else if (editing) {
            router.put(`/charges/${editing.uuid}`, payload, {
                onSuccess: () => closeModal(),
                onFinish:  () => setProcessing(false),
            });
        }
    }

    function handleDelete(c: Charge) {
        confirm({
            title: 'Supprimer cette charge ?',
            description: `« ${c.description} » sera supprimée définitivement.`,
            onConfirm: () => {
                router.delete(`/charges/${c.uuid}`, { onFinish: closeConfirm });
            },
        });
    }

    const recLabel = (v: string) => RECURRENCES.find(r => r.value === v)?.label ?? v;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Charges" />
            <ConfirmDialog open={confirmState.open} onOpenChange={closeConfirm}
                title={confirmState.title} description={confirmState.description}
                onConfirm={confirmState.onConfirm} />

            {/* Modal */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={closeModal}>
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-foreground text-base">
                                {modal === 'create' ? 'Nouvelle charge' : 'Modifier la charge'}
                            </h2>
                            <button onClick={closeModal} className="rounded-lg p-1.5 hover:bg-accent">
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>
                        {props.errors && Object.keys(props.errors).length > 0 && (
                            <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-3 py-2.5 text-xs text-red-700 dark:text-red-400">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span>{Object.values(props.errors)[0]}</span>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Catégorie *</label>
                                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                                        <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(c => (
                                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Date *</label>
                                    <Input type="date" value={form.date}
                                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                        className="rounded-xl h-9" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Description *</label>
                                <Input value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Ex. Loyer du local · Juillet"
                                    className="rounded-xl h-9" required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Montant *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">MAD</span>
                                        <Input type="number" step="0.01" min={0} value={form.amount}
                                            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                            className="rounded-xl h-9 pl-12 text-right" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Mode de paiement</label>
                                    <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                                        <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Récurrence</label>
                                    <Select value={form.recurrence} onValueChange={v => setForm(f => ({ ...f, recurrence: v }))}>
                                        <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {RECURRENCES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Statut</label>
                                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                                        <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="paye">Payé</SelectItem>
                                            <SelectItem value="a_payer">À payer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" className="rounded-xl" onClick={closeModal}>Annuler</Button>
                                <Button type="submit" disabled={processing} className="rounded-xl bg-blue-600 hover:bg-blue-700">
                                    {processing ? 'Enregistrement…' : modal === 'create' ? 'Ajouter' : 'Mettre à jour'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Charges</h1>
                        <p className="text-sm text-muted-foreground">Loyer, salaires, énergie, taxes et autres dépenses</p>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="rounded-xl"
                            onClick={() => window.open('/charges/export/pdf', '_blank')}>
                            <Download className="h-3.5 w-3.5 mr-1.5" /> Exporter PDF
                        </Button>
                        <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Nouvelle charge
                        </Button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Total charges (mois)</p>
                        <p className="text-xl font-bold text-foreground font-mono">{fmt(stats.total_mois)}</p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Mensuel
                        </div>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Loyer</p>
                        <p className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">{fmt(stats.loyer_mois)}</p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Mensuel
                        </div>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Salaires</p>
                        <p className="text-xl font-bold text-violet-600 dark:text-violet-400 font-mono">{fmt(stats.salaires_mois)}</p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" /> Masse salariale
                        </div>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">À payer</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400 font-mono">{fmt(stats.a_payer)}</p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> {stats.a_payer_count} en attente
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-48 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher une charge…"
                            className="pl-9 rounded-xl h-9" />
                    </div>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="rounded-xl h-9 w-44">
                            <SelectValue placeholder="Toutes catégories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes catégories</SelectItem>
                            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <span className="ml-auto text-sm text-muted-foreground self-center">
                        Total : {fmt(charges.reduce((s, c) => s + c.amount, 0))}
                    </span>
                </div>

                {/* Table */}
                <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                                <tr>
                                    <th className="px-4 py-3 text-left w-28">Date</th>
                                    <th className="px-4 py-3 text-left w-32">Catégorie</th>
                                    <th className="px-4 py-3 text-left">Description</th>
                                    <th className="px-4 py-3 text-center w-28">Récurrence</th>
                                    <th className="px-4 py-3 text-right w-32">Montant</th>
                                    <th className="px-4 py-3 text-center w-24">Statut</th>
                                    <th className="px-4 py-3 w-20" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {charges.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                                            <FileText className="w-8 h-8 mx-auto opacity-20 mb-2" />
                                            <p>Aucune charge enregistrée.</p>
                                        </td>
                                    </tr>
                                ) : charges.map(c => (
                                    <tr key={c.uuid} className="hover:bg-accent/30 transition-colors">
                                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{c.date_display}</td>
                                        <td className="px-4 py-3"><CatBadge cat={c.category} /></td>
                                        <td className="px-4 py-3 font-medium text-foreground">{c.description}</td>
                                        <td className="px-4 py-3 text-center">
                                            {c.recurrence !== 'ponctuelle' ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                    ↺ {recLabel(c.recurrence)}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Ponctuel</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-semibold text-sm">{fmt(c.amount)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {c.status === 'paye' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                                                    ● Payé
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                                                    ● À payer
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 justify-end">
                                                <button onClick={() => openEdit(c)}
                                                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleDelete(c)}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-muted-foreground hover:text-red-600 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
