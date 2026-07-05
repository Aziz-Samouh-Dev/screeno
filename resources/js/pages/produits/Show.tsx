import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    ArrowLeft, Edit2, Trash2, Package, Tag, Copy, Check,
    TrendingUp, BarChart3, Calendar, Clock, ImageOff, X, Truck,
} from 'lucide-react';
import { useState } from 'react';

interface Supplier { id: number; uuid: string; nom: string; }

interface Produit {
    uuid: string;
    nom: string;
    sku: string;
    image?: string | null;
    description?: string | null;
    purchase_price: number;
    sale_price: number;
    stock_quantity: number;
    stock_alert_threshold: number;
    supplier?: Supplier | null;
    created_at: string;
    updated_at: string;
}

interface Props { produit: Produit }

function stockInfo(qty: number, threshold: number) {
    if (qty > threshold) return { label: 'En stock',     cls: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',  bar: 'bg-green-500'  };
    if (qty > 0)         return { label: 'Stock faible', cls: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',  bar: 'bg-amber-500'  };
    return                      { label: 'Rupture',       cls: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',              bar: 'bg-red-400'    };
}

export default function Show({ produit }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Produits', href: '/produits' },
        { title: produit.nom, href: `/produits/${produit.uuid}` },
    ];

    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied]       = useState(false);
    const [imgErr, setImgErr]       = useState(false);

    const si     = stockInfo(produit.stock_quantity, produit.stock_alert_threshold);
    const margin = Number(produit.sale_price) - Number(produit.purchase_price);
    const marginPct = Number(produit.purchase_price) > 0
        ? (margin / Number(produit.purchase_price)) * 100 : 0;

    const copySku = async () => {
        try {
            await navigator.clipboard.writeText(produit.sku);
            setCopied(true);
            toast.success('SKU copié dans le presse-papiers');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Erreur lors de la copie du SKU');
        }
    };

    const handleDelete = () => {
        if (confirm('Supprimer ce produit ? Cette action est irréversible.'))
            router.delete(`/produits/${produit.uuid}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={produit.nom} />

            <div className="flex flex-col gap-6 p-6">

                {/* HEADER */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.visit('/produits')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">{produit.nom}</h1>
                            <p className="text-sm font-mono text-muted-foreground">{produit.sku}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="rounded-xl" onClick={() => router.visit(`/produits/${produit.uuid}/edit`)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Modifier
                        </Button>
                        <Button variant="destructive" className="rounded-xl" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* BODY */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* IMAGE + SKU */}
                    <div className="space-y-4">
                        {/* Image */}
                        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                            <div
                                className={`aspect-square ${produit.image && !imgErr ? 'cursor-zoom-in' : ''} bg-muted/40 flex items-center justify-center overflow-hidden`}
                                onClick={() => produit.image && !imgErr && setShowModal(true)}
                            >
                                {produit.image && !imgErr ? (
                                    <img src={`/storage/${produit.image}`} alt={produit.nom}
                                        className="w-full h-full object-cover"
                                        onError={() => setImgErr(true)} />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                                        <ImageOff className="h-12 w-12" />
                                        <span className="text-xs">Aucune image</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SKU copy */}
                        <button
                            onClick={copySku}
                            className="w-full rounded-2xl border border-border bg-card p-4 flex items-center gap-3 hover:bg-accent transition-colors shadow-sm"
                        >
                            <div className="rounded-xl bg-muted p-2">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">SKU</p>
                                <p className="font-mono font-semibold text-foreground/90">{produit.sku}</p>
                            </div>
                            {copied
                                ? <Check className="h-4 w-4 text-green-500" />
                                : <Copy className="h-4 w-4 text-muted-foreground" />}
                        </button>

                        {/* Stock status */}
                        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Niveau de stock</p>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${si.cls}`}>{si.label}</span>
                            </div>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-3xl font-black text-foreground">{produit.stock_quantity}</span>
                                <span className="text-sm text-muted-foreground">unités</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className={`h-full rounded-full ${si.bar} transition-all`}
                                    style={{ width: `${Math.min(100, (produit.stock_quantity / 50) * 100)}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* DETAILS */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Pricing cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Prix d'achat</p>
                                <p className="text-xl font-black text-foreground">{Number(produit.purchase_price).toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">MAD</p>
                            </div>
                            <div className="rounded-2xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-5 shadow-sm">
                                <p className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wide mb-2">Prix de vente</p>
                                <p className="text-xl font-black text-blue-800 dark:text-blue-300">{Number(produit.sale_price).toFixed(2)}</p>
                                <p className="text-xs text-blue-400 mt-0.5">MAD</p>
                            </div>
                            <div className={`rounded-2xl p-5 shadow-sm border ${margin >= 0 ? 'bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900' : 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900'}`}>
                                <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${margin >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                    <TrendingUp className="inline h-3 w-3 mr-1" />Marge
                                </p>
                                <p className={`text-xl font-black ${margin >= 0 ? 'text-green-800 dark:text-green-300' : 'text-red-700 dark:text-red-400'}`}>
                                    {margin >= 0 ? '+' : ''}{margin.toFixed(2)}
                                </p>
                                <p className={`text-xs mt-0.5 ${margin >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-400'}`}>
                                    {marginPct.toFixed(1)}%
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" /> Description
                            </h3>
                            {produit.description ? (
                                <p className="text-sm text-muted-foreground leading-relaxed">{produit.description}</p>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Aucune description.</p>
                            )}
                        </div>

                        {/* Dates */}
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-muted-foreground" /> Infos produit
                            </h3>
                            <div className="space-y-3">
                                {produit.supplier && (
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Truck className="h-4 w-4" />
                                            <span>Fournisseur</span>
                                        </div>
                                        <button
                                            onClick={() => router.visit(`/suppliers/${produit.supplier!.uuid}`)}
                                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                            {produit.supplier.nom}
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Créé le</span>
                                    </div>
                                    <span className="font-medium text-foreground/90">
                                        {new Date(produit.created_at).toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>Dernière mise à jour</span>
                                    </div>
                                    <span className="font-medium text-foreground/90">
                                        {new Date(produit.updated_at).toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* IMAGE MODAL */}
            {showModal && produit.image && !imgErr && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowModal(false)}>
                    <button className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                        onClick={() => setShowModal(false)}>
                        <X className="h-5 w-5" />
                    </button>
                    <img
                        src={`/storage/${produit.image}`}
                        alt={produit.nom}
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </AppLayout>
    );
}
