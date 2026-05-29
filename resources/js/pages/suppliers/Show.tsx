import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';
import { useState } from 'react';
import {
    ArrowLeft, Edit2, Trash2, Building2, Mail, Phone, MapPin, Calendar, FileText,
    Package, ShoppingBag, RotateCcw, BookOpen, ArrowDownUp,
} from 'lucide-react';

interface Supplier {
    uuid: string; nom: string; email?: string; telephone: string;
    adresse?: string; ville?: string; notes?: string;
    status: 'active' | 'inactive'; created_at: string; balance: number;
}

interface Product {
    uuid: string; nom: string; sku: string;
    purchase_price: string; sale_price: string;
    stock_quantity: number; stock_alert_threshold: number; image: string | null;
}

interface Txn {
    uuid: string; type: 'F' | 'R' | 'P'; return_type?: string | null;
    product_name: string; quantity: number | null; total_price: number; created_at: string;
}

export default function Show() {
    const { supplier, products, transactions, totalPurchases, totalReturns, totalPayments } = usePage().props as unknown as {
        supplier: Supplier; products: Product[]; transactions: Txn[];
        totalPurchases: number; totalReturns: number; totalPayments: number;
    };
    const [processing, setProcessing] = useState(false);
    const { confirmState, confirm, closeConfirm } = useConfirmDialog();

    if (!supplier) return null;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Fournisseurs', href: '/suppliers' },
        { title: supplier.nom, href: `/suppliers/${supplier.uuid}` },
    ];

    const handleDelete = () => {
        confirm({
            title: 'Supprimer ce fournisseur ?',
            description: `« ${supplier.nom} » sera définitivement supprimé.`,
            onConfirm: () => {
                setProcessing(true);
                router.delete(`/suppliers/${supplier.uuid}`, {
                    onFinish: () => { setProcessing(false); closeConfirm(); },
                });
            },
        });
    };

    const fmt = (n: number) => Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={supplier.nom} />
            <ConfirmDialog open={confirmState.open} onOpenChange={closeConfirm}
                title={confirmState.title} description={confirmState.description}
                onConfirm={confirmState.onConfirm} loading={processing} />

            <div className="flex flex-col gap-6 p-6">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <Button variant="link" onClick={() => router.visit('/suppliers')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux fournisseurs
                    </Button>
                    <div className="flex gap-2">
                        <Button size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700"
                            onClick={() => router.visit(`/suppliers/${supplier.uuid}/purchase`)}>
                            <ShoppingBag className="h-4 w-4 mr-1.5" /> Achat
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-lg border-orange-200 text-orange-700 hover:bg-orange-50"
                            onClick={() => router.visit(`/suppliers/${supplier.uuid}/return`)}>
                            <RotateCcw className="h-4 w-4 mr-1.5" /> Retour
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-lg"
                            onClick={() => router.visit(`/suppliers/${supplier.uuid}/ledger`)}>
                            <BookOpen className="h-4 w-4 mr-1.5" /> Grand livre
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-lg"
                            onClick={() => router.visit(`/suppliers/${supplier.uuid}/edit`)}>
                            <Edit2 className="h-4 w-4 mr-1.5" /> Modifier
                        </Button>
                        <Button size="sm" variant="destructive" className="rounded-lg" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4 mr-1.5" /> Supprimer
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT — Supplier info */}
                    <div className="space-y-4">
                        <div className="bg-card rounded-3xl border border-border shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30">
                                    <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">{supplier.nom}</h2>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                        supplier.status === 'active'
                                            ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                                            : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {supplier.status === 'active' ? 'Actif' : 'Inactif'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4 text-sm">
                                {supplier.telephone && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Téléphone</p>
                                            <p className="font-medium text-foreground">{supplier.telephone}</p>
                                        </div>
                                    </div>
                                )}
                                {supplier.email && (
                                    <div className="flex items-start gap-3">
                                        <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">E-mail</p>
                                            <p className="font-medium text-foreground">{supplier.email}</p>
                                        </div>
                                    </div>
                                )}
                                {supplier.ville && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ville</p>
                                            <p className="font-medium text-foreground">{supplier.ville}</p>
                                        </div>
                                    </div>
                                )}
                                {supplier.notes && (
                                    <div className="flex items-start gap-3">
                                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notes</p>
                                            <p className="font-medium text-foreground">{supplier.notes}</p>
                                        </div>
                                    </div>
                                )}
                                {supplier.created_at && (
                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fournisseur depuis</p>
                                            <p className="font-medium text-foreground">{new Date(supplier.created_at).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Balance card */}
                        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Solde actuel</p>
                            <p className={`text-2xl font-bold font-mono ${
                                supplier.balance > 0.005 ? 'text-amber-600 dark:text-amber-400' :
                                supplier.balance < -0.005 ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                                {fmt(supplier.balance)} MAD
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {supplier.balance > 0.005 ? 'Montant dû au fournisseur' :
                                 supplier.balance < -0.005 ? 'Avoir fournisseur' : 'Solde nul'}
                            </p>
                        </div>

                        {/* Totals */}
                        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-3">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Récapitulatif</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total achats</span>
                                    <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">{fmt(totalPurchases ?? 0)} MAD</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total retours</span>
                                    <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">{fmt(totalReturns ?? 0)} MAD</span>
                                </div>
                                <div className="flex justify-between border-t border-border pt-2">
                                    <span className="text-muted-foreground">Total paiements</span>
                                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{fmt(totalPayments ?? 0)} MAD</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT — Products + Recent transactions */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Products */}
                        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-border/60 flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold text-foreground text-sm">Produits de ce fournisseur</h3>
                                <span className="ml-auto text-xs text-muted-foreground">{products?.length ?? 0} produit(s)</span>
                            </div>
                            {products?.length > 0 ? (
                                <div className="divide-y divide-border/60">
                                    {products.map((p: Product) => {
                                        const lowStock = p.stock_quantity <= p.stock_alert_threshold;
                                        return (
                                            <div key={p.uuid} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
                                                    <Package className="h-4 w-4 text-indigo-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <Link href={`/produits/${p.uuid}`} className="font-medium text-foreground text-sm hover:text-blue-600 transition-colors">
                                                        {p.nom}
                                                    </Link>
                                                    <p className="text-[11px] text-muted-foreground font-mono">{p.sku}</p>
                                                </div>
                                                <div className="text-right text-xs">
                                                    <p className="font-mono font-semibold text-foreground">{Number(p.purchase_price).toFixed(2)} MAD</p>
                                                    <p className="text-muted-foreground">achat</p>
                                                </div>
                                                <div className="text-right text-xs min-w-16">
                                                    <p className={`font-mono font-semibold ${lowStock ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                        {p.stock_quantity}
                                                    </p>
                                                    <p className="text-muted-foreground">stock</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                                    <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    Aucun produit lié à ce fournisseur
                                </div>
                            )}
                        </div>

                        {/* Recent transactions */}
                        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-border/60 flex items-center gap-2">
                                <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold text-foreground text-sm">Dernières transactions</h3>
                                <Link href={`/suppliers/${supplier.uuid}/ledger`}
                                    className="ml-auto text-xs text-blue-500 hover:underline">Voir tout</Link>
                            </div>
                            {transactions?.length > 0 ? (
                                <div className="divide-y divide-border/60">
                                    {transactions.map((t: Txn) => (
                                        <div key={t.uuid} className="px-5 py-2.5 flex items-center gap-3 text-sm">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                                t.type === 'F' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' :
                                                t.type === 'P' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' :
                                                'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400'
                                            }`}>
                                                {t.type === 'F' ? 'ACHAT' : t.type === 'P' ? 'PAIEMENT' : t.return_type === 'change' ? 'ÉCHANGE' : t.return_type === 'refund' ? 'REMB.' : 'PERTE'}
                                            </span>
                                            <span className="text-foreground flex-1 truncate">{t.product_name}</span>
                                            {t.quantity != null && <span className="text-muted-foreground text-xs shrink-0">x{t.quantity}</span>}
                                            <span className={`font-mono font-semibold shrink-0 ${
                                                t.type === 'F' ? 'text-amber-600' :
                                                t.type === 'P' ? 'text-emerald-600' : 'text-orange-600'
                                            }`}>{Number(t.total_price).toFixed(2)} MAD</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                                    Aucune transaction
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
