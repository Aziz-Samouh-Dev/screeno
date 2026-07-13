import { useState, useEffect, ReactNode } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    ChevronRight, ChevronLeft, Plus, Package, AlertCircle, XCircle,
    Search, ArrowUpDown, Trash2, Pencil, Eye, X, SlidersHorizontal,
    Layers, TrendingUp, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Produits', href: '/produits' }];

interface Produit {
    uuid: string; nom: string; sku: string;
    image: string | null; purchase_price: string; sale_price: string;
    stock_quantity: number; stock_alert_threshold: number;
}
interface PaginatedData {
    total: ReactNode; data: Produit[];
    current_page: number; last_page: number; per_page: number;
}
interface Props {
    produits: PaginatedData;
    globalStats: { totalProduits: number; totalStock: number; lowStock: number; outOfStock: number };
    filters: { search?: string; stock?: string; sort?: string; per_page?: string };
}

function stockBadge(qty: number, threshold: number) {
    if (qty > threshold) return { label: 'En stock',     cls: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' };
    if (qty > 0)         return { label: 'Stock faible', cls: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',             dot: 'bg-amber-500'  };
    return                      { label: 'Rupture',       cls: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',                         dot: 'bg-red-500'    };
}

const fmt = (n: number) => Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 });

function ProduitImg({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
    const [err, setErr] = useState(false);
    if (!src || err) {
        return <div className={`rounded-lg bg-muted flex items-center justify-center shrink-0 ${className ?? 'h-9 w-9'}`}>
            <Package className="h-4 w-4 text-muted-foreground" />
        </div>;
    }
    return <img src={`/file/${src}`} alt={alt}
        className={`${className ?? 'h-9 w-9'} rounded-lg object-cover shrink-0 border border-border`}
        onError={() => setErr(true)} />;
}

export default function Index() {
    const { produits, filters, globalStats } = usePage().props as unknown as Props;

    const [search,     setSearch]     = useState(filters.search  || '');
    const [stock,      setStock]      = useState(filters.stock   || 'all');
    const [sort,       setSort]       = useState(filters.sort    || '');
    const [perPage,    setPerPage]    = useState(filters.per_page || '10');
    const [processing, setProcessing] = useState(false);

    const { confirmState, confirm, closeConfirm } = useConfirmDialog();

    const go = (extra: object = {}) =>
        router.get('/produits',
            { search, stock: stock === 'all' ? undefined : stock, sort, per_page: perPage, ...extra },
            { preserveState: true, preserveScroll: true, replace: true });

    const handleSort = (field: string) => {
        const dir = sort === `${field}_asc` ? 'desc' : 'asc';
        const s = `${field}_${dir}`; setSort(s); go({ sort: s });
    };

    useEffect(() => {
        const t = setTimeout(() => go(), 350);
        return () => clearTimeout(t);
    }, [search, stock, perPage]);

    const handleDelete = (uuid: string, nom: string) => {
        confirm({
            title: 'Supprimer ce produit ?',
            description: `« ${nom} » sera définitivement supprimé. Cette action est irréversible.`,
            onConfirm: () => {
                setProcessing(true);
                router.delete(`/produits/${uuid}`, {
                    onFinish: () => { setProcessing(false); closeConfirm(); },
                });
            },
        });
    };

    const SortBtn = ({ field, label }: { field: string; label: string }) => (
        <span className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort(field)}>
            {label}
            <ArrowUpDown className={`ml-1 h-3 w-3 inline-block align-middle ${sort.startsWith(field) ? 'opacity-100 text-indigo-500' : 'opacity-30'}`} />
        </span>
    );

    const from = produits.data.length > 0 ? ((produits.current_page - 1) * Number(perPage)) + 1 : 0;
    const to   = Math.min(produits.current_page * Number(perPage), Number(produits.total));

    const statCards = [
        { label: 'Total produits',  value: globalStats.totalProduits, icon: Package,     bg: 'bg-muted',                                    ic: 'text-muted-foreground', border: 'border-border'   },
        { label: 'Unités en stock', value: globalStats.totalStock,    icon: BarChart3,   bg: 'bg-blue-50 dark:bg-blue-950/30',              ic: 'text-blue-600 dark:text-blue-400',  border: 'border-blue-100 dark:border-blue-900'   },
        { label: 'Stock faible',    value: globalStats.lowStock,      icon: AlertCircle, bg: 'bg-amber-50 dark:bg-amber-950/30',            ic: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900'  },
        { label: 'Rupture de stock',value: globalStats.outOfStock,    icon: XCircle,     bg: 'bg-red-50 dark:bg-red-950/30',                ic: 'text-red-600 dark:text-red-400',    border: 'border-red-100 dark:border-red-900'    },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produits" />

            <ConfirmDialog open={confirmState.open} onOpenChange={closeConfirm}
                title={confirmState.title} description={confirmState.description}
                onConfirm={confirmState.onConfirm} loading={processing} />

            <div className="flex flex-col gap-6 p-6">

                {/* ── Header ── */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/60">
                            <Package className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Catalogue produits</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">Gérez votre inventaire et vos produits</p>
                        </div>
                    </div>
                    <Link href="/produits/create">
                        <Button size="sm" className="rounded-lg bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="h-4 w-4 mr-1.5" /> Nouveau produit
                        </Button>
                    </Link>
                </div>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map(c => (
                        <div key={c.label} className={`bg-card rounded-xl border shadow-sm p-5 ${c.border}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2 rounded-lg ${c.bg}`}>
                                    <c.icon className={`h-4 w-4 ${c.ic}`} />
                                </div>
                            </div>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{c.label}</p>
                            <p className="text-2xl font-bold text-foreground mt-1 leading-none">{c.value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Table card ── */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="px-5 py-3.5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Rechercher par nom, SKU…"
                                className="pl-9 h-9 rounded-lg border-border"
                                value={search} onChange={e => setSearch(e.target.value)} />
                            {search && (
                                <button onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground/90">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 border border-border rounded-lg px-2.5 py-1.5 bg-card">
                            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                            <Select value={stock} onValueChange={setStock}>
                                <SelectTrigger className="border-0 p-0 h-auto text-xs font-medium text-foreground/90 shadow-none focus:ring-0 w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les stocks</SelectItem>
                                    <SelectItem value="in_stock">En stock</SelectItem>
                                    <SelectItem value="low_stock">Stock faible</SelectItem>
                                    <SelectItem value="out_of_stock">Rupture</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="sm:ml-auto text-xs text-muted-foreground font-medium">
                            {produits.total} produit{Number(produits.total) !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-175">
                            <thead className="bg-muted/40 border-b border-border/60">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-10">#</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Produit</th>
                                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        <SortBtn field="purchase" label="Prix achat" />
                                    </th>
                                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        <SortBtn field="sale" label="Prix vente" />
                                    </th>
                                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        <SortBtn field="stock" label="Stock" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {produits.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Package className="h-12 w-12 text-muted-foreground/20" />
                                                <p className="font-medium text-muted-foreground">Aucun produit trouvé</p>
                                                {search
                                                    ? <button onClick={() => setSearch('')} className="text-xs text-indigo-500 hover:underline">Effacer la recherche</button>
                                                    : <Link href="/produits/create"><span className="text-xs text-indigo-500 hover:underline">Ajouter votre premier produit →</span></Link>
                                                }
                                            </div>
                                        </td>
                                    </tr>
                                ) : produits.data.map((p, idx) => {
                                    const rowNum = ((produits.current_page - 1) * Number(perPage)) + idx + 1;
                                    const sb     = stockBadge(p.stock_quantity, p.stock_alert_threshold);
                                    const margin = Number(p.sale_price) - Number(p.purchase_price);
                                    return (
                                        <tr key={p.uuid}
                                            className="hover:bg-violet-50/20 dark:hover:bg-violet-950/20 transition-colors cursor-pointer group"
                                            onClick={() => router.visit(`/produits/${p.uuid}`)}>

                                            <td className="px-4 py-3.5">
                                                <span className="text-xs text-muted-foreground/40 font-mono group-hover:text-violet-300">{rowNum}</span>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <ProduitImg src={p.image} alt={p.nom} />
                                                    <div>
                                                        <p className="font-semibold text-foreground group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors text-sm">{p.nom}</p>
                                                        <p className="text-xs font-mono text-muted-foreground">{p.sku}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5 text-right font-mono text-xs text-muted-foreground">
                                                {fmt(Number(p.purchase_price))} MAD
                                            </td>

                                            <td className="px-4 py-3.5 text-right">
                                                <p className="font-mono text-xs font-semibold text-foreground">{fmt(Number(p.sale_price))} MAD</p>
                                                {margin > 0 && (
                                                    <div className="flex items-center justify-end gap-0.5 mt-0.5">
                                                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                                                        <span className="text-[10px] text-emerald-500 font-medium">+{fmt(margin)}</span>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 text-right font-semibold text-foreground text-sm">
                                                {p.stock_quantity}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${sb.cls}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${sb.dot}`} />
                                                    {sb.label}
                                                </span>
                                            </td>

                                            <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <button title="Voir"
                                                        onClick={() => router.visit(`/produits/${p.uuid}`)}
                                                        className="h-7 w-7 rounded-lg hover:bg-accent text-muted-foreground flex items-center justify-center transition-colors">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button title="Modifier"
                                                        onClick={() => router.visit(`/produits/${p.uuid}/edit`)}
                                                        className="h-7 w-7 rounded-lg hover:bg-accent text-muted-foreground flex items-center justify-center transition-colors">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button title="Supprimer"
                                                        onClick={() => handleDelete(p.uuid, p.nom)}
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
                            {produits.data.length > 0
                                ? `Affichage de ${from} à ${to} sur ${produits.total} produits`
                                : '0 produit'}
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
                                Page <span className="font-semibold text-foreground/90">{produits.current_page}</span> / <span className="font-semibold text-foreground/90">{produits.last_page}</span>
                            </span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                                    disabled={produits.current_page === 1}
                                    onClick={() => go({ page: produits.current_page - 1 })}>
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                                    disabled={produits.current_page === produits.last_page}
                                    onClick={() => go({ page: produits.current_page + 1 })}>
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
