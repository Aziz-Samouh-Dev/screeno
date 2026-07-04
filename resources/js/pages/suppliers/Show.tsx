import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, Edit2, Trash2, ShoppingBag, RotateCcw, CreditCard, ClipboardList,
    Building2, Mail, Phone, MapPin, Calendar, StickyNote, TrendingUp, TrendingDown,
} from 'lucide-react';

interface Transaction {
    uuid: string;
    type: 'F' | 'R' | 'P';
    return_type?: string | null;
    product_name: string | null;
    quantity: number | null;
    unit_price: number;
    total_price: number;
    running_total: number;
    notes: string | null;
    created_at: string;
}

interface Supplier {
    uuid: string;
    nom: string;
    email?: string | null;
    telephone?: string | null;
    adresse?: string | null;
    ville?: string | null;
    notes?: string | null;
    status: 'active' | 'inactive';
    created_at: string;
}

interface Props {
    supplier: Supplier;
    transactions: Transaction[];
    balance: number;
}

const fmt = (n: number) =>
    Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD';

function fmtDateTime(iso: string) {
    const d = new Date(iso);
    const date = d.toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
}

const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

function txnLabel(t: Transaction): string {
    if (t.type === 'F') return 'F';
    if (t.type === 'P') return 'P';
    if (t.return_type === 'change') return 'Ech';
    if (t.return_type === 'refund') return 'Remb';
    return 'Perte';
}

export default function Show({ supplier, transactions, balance }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Fournisseurs', href: '/suppliers' },
        { title: supplier.nom, href: `/suppliers/${supplier.uuid}` },
    ];

    const totalPurchases = transactions.filter(t => t.type === 'F').reduce((s, t) => s + t.total_price, 0);
    const totalReturns   = transactions.filter(t => t.type === 'R').reduce((s, t) => s + t.total_price, 0);
    const totalPayments  = transactions.filter(t => t.type === 'P').reduce((s, t) => s + t.total_price, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={supplier.nom} />

            <div className="flex flex-col gap-6 p-6">

                {/* HEADER */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl"
                            onClick={() => router.visit('/suppliers')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                                {getInitials(supplier.nom)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-foreground">{supplier.nom}</h1>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
                                        supplier.status === 'active'
                                            ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/60'
                                            : 'bg-red-50 dark:bg-red-950/40 text-red-600 border-red-200 dark:border-red-900/60'
                                    }`}>{supplier.status === 'active' ? 'Actif' : 'Inactif'}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {[supplier.telephone, supplier.email, supplier.ville].filter(Boolean).join(' · ') || 'Aucun contact'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl"
                            onClick={() => router.visit(`/suppliers/${supplier.uuid}/edit`)}>
                            <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Modifier
                        </Button>
                        <Button variant="destructive" size="sm" className="rounded-xl"
                            onClick={() => { if (confirm('Supprimer ce fournisseur ?')) router.delete(`/suppliers/${supplier.uuid}`); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* ACTION CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                        onClick={() => router.visit(`/suppliers/${supplier.uuid}/purchase`)}
                        className="flex flex-col items-center gap-2 rounded-2xl border-2 border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/60 p-4 transition-colors group">
                        <div className="rounded-xl bg-blue-600 p-3 group-hover:bg-blue-700 transition-colors">
                            <ShoppingBag className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-blue-800 dark:text-blue-300 text-sm">Achat</span>
                        <span className="text-xs text-blue-500 dark:text-blue-400">Enregistrer un achat</span>
                    </button>

                    <button
                        onClick={() => router.visit(`/suppliers/${supplier.uuid}/return`)}
                        className="flex flex-col items-center gap-2 rounded-2xl border-2 border-orange-200 dark:border-orange-900/60 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-950/60 p-4 transition-colors group">
                        <div className="rounded-xl bg-orange-500 p-3 group-hover:bg-orange-600 transition-colors">
                            <RotateCcw className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-orange-800 dark:text-orange-300 text-sm">Retour</span>
                        <span className="text-xs text-orange-500 dark:text-orange-400">Retourner des produits</span>
                    </button>

                    <button
                        onClick={() => router.visit(`/suppliers/${supplier.uuid}/payment`)}
                        className="flex flex-col items-center gap-2 rounded-2xl border-2 border-green-200 dark:border-green-900/60 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-950/60 p-4 transition-colors group">
                        <div className="rounded-xl bg-green-600 p-3 group-hover:bg-green-700 transition-colors">
                            <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-green-800 dark:text-green-300 text-sm">Paiement</span>
                        <span className="text-xs text-green-500 dark:text-green-400">Payer le fournisseur</span>
                    </button>

                    <button
                        onClick={() => router.visit(`/suppliers/${supplier.uuid}/ledger`)}
                        className="flex flex-col items-center gap-2 rounded-2xl border-2 border-border bg-muted/40 hover:bg-accent p-4 transition-colors group">
                        <div className="rounded-xl bg-foreground p-3 group-hover:bg-foreground/90 transition-colors">
                            <ClipboardList className="h-5 w-5 text-background" />
                        </div>
                        <span className="font-bold text-foreground/90 text-sm">Historique</span>
                        <span className="text-xs text-muted-foreground">Voir toutes les opérations</span>
                    </button>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 p-4">
                        <p className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wide">Total achats</p>
                        <p className="text-xl font-bold text-blue-800 dark:text-blue-300 font-mono mt-1">{fmt(totalPurchases)}</p>
                        <p className="text-xs text-blue-400 mt-0.5">{transactions.filter(t => t.type === 'F').length} achats</p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 dark:border-orange-900/60 bg-orange-50 dark:bg-orange-950/40 p-4">
                        <p className="text-xs font-bold text-orange-500 dark:text-orange-400 uppercase tracking-wide">Total retours</p>
                        <p className="text-xl font-bold text-orange-800 dark:text-orange-300 font-mono mt-1">{fmt(totalReturns)}</p>
                        <p className="text-xs text-orange-400 mt-0.5">{transactions.filter(t => t.type === 'R').length} retours</p>
                    </div>
                    <div className="rounded-2xl border border-green-100 dark:border-green-900/60 bg-green-50 dark:bg-green-950/40 p-4">
                        <p className="text-xs font-bold text-green-500 dark:text-green-400 uppercase tracking-wide">Total payé</p>
                        <p className="text-xl font-bold text-green-800 dark:text-green-300 font-mono mt-1">{fmt(totalPayments)}</p>
                        <p className="text-xs text-green-400 mt-0.5">{transactions.filter(t => t.type === 'P').length} paiements</p>
                    </div>
                    <div className={`rounded-2xl p-4 ${
                        balance > 0
                            ? 'bg-foreground'
                            : balance < 0
                            ? 'border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40'
                            : 'border border-green-200 dark:border-green-900/60 bg-green-50 dark:bg-green-950/40'
                    }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                            {balance > 0
                                ? <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                                : <TrendingDown className={`h-3.5 w-3.5 ${balance < 0 ? 'text-blue-500 dark:text-blue-400' : 'text-green-500'}`} />}
                            <p className={`text-xs font-bold uppercase tracking-wide ${
                                balance > 0 ? 'text-background/60' : balance < 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-500'
                            }`}>
                                {balance < 0 ? 'Avoir fournisseur' : 'Solde à payer'}
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
                            {balance > 0 ? 'En attente de paiement' : balance < 0 ? 'Crédit fournisseur' : 'Soldé'}
                        </p>
                    </div>
                </div>

                {/* BODY */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Coordonnées */}
                    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4 self-start">
                        <h4 className="font-bold text-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" /> Coordonnées
                        </h4>
                        {supplier.email && (
                            <div className="flex items-start gap-2.5">
                                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">E-mail</p>
                                    <p className="text-sm font-medium text-foreground">{supplier.email}</p>
                                </div>
                            </div>
                        )}
                        {supplier.telephone && (
                            <div className="flex items-start gap-2.5">
                                <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Téléphone</p>
                                    <p className="text-sm font-medium text-foreground">{supplier.telephone}</p>
                                </div>
                            </div>
                        )}
                        {(supplier.adresse || supplier.ville) && (
                            <div className="flex items-start gap-2.5">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Adresse</p>
                                    <p className="text-sm font-medium text-foreground">
                                        {[supplier.adresse, supplier.ville].filter(Boolean).join(', ')}
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-start gap-2.5">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground">Fournisseur depuis</p>
                                <p className="text-sm font-medium text-foreground">
                                    {new Date(supplier.created_at).toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                        {supplier.notes && (
                            <div className="flex items-start gap-2.5">
                                <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Notes</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{supplier.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Transaction table */}
                    <div className="lg:col-span-3 rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                            <h3 className="font-bold text-foreground">Historique des opérations</h3>
                            <button onClick={() => router.visit(`/suppliers/${supplier.uuid}/ledger`)}
                                className="text-xs text-blue-500 hover:underline font-semibold">
                                Voir tout →
                            </button>
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
                                        <th className="px-4 py-3 text-right w-28">RT</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                                                <ShoppingBag className="w-8 h-8 mx-auto opacity-20 mb-2" />
                                                <p>Aucune opération · utilisez les boutons ci-dessus pour commencer.</p>
                                            </td>
                                        </tr>
                                    ) : transactions.slice(0, 20).map((t) => {
                                        const typeColors: Record<string, string> = {
                                            F:     'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
                                            P:     'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400',
                                            R:     'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400',
                                        };
                                        const isCredit = t.type === 'P' || (t.type === 'R' && t.return_type === 'refund');
                                        return (
                                            <tr key={t.uuid} className="hover:bg-accent transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-muted-foreground text-xs">{fmtDateTime(t.created_at)}</span>
                                                    <span className={`ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-bold ${typeColors[t.type]}`}>
                                                        {txnLabel(t)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-foreground">
                                                    {t.product_name ?? <span className="text-muted-foreground italic">-</span>}
                                                </td>
                                                <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                                                    {t.quantity ?? '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                                                    {t.unit_price ? fmt(t.unit_price) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-semibold text-xs">
                                                    <span className={isCredit ? 'text-green-600 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'}>
                                                        {isCredit ? '-' : '+'}{fmt(t.total_price)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-xs">
                                                    <span className={
                                                        t.running_total > 0
                                                            ? 'text-amber-600 dark:text-amber-400'
                                                            : t.running_total < 0
                                                            ? 'text-blue-600 dark:text-blue-400'
                                                            : 'text-green-600 dark:text-green-400'
                                                    }>
                                                        {fmt(Math.abs(t.running_total))}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
