'use client';

import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Warehouse, Search, X, ExternalLink, RotateCcw, Truck } from 'lucide-react';

interface StockRecord {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    client_uuid: string;
    client_nom: string;
    supplier_uuid: string | null;
    supplier_nom: string | null;
    created_at: string;
}

interface PaginatedRecords {
    data: StockRecord[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    records: PaginatedRecords;
    totalQty: number;
    filters: { search: string };
}

function fmtDT(iso: string) {
    const d = new Date(iso);
    const dd  = String(d.getDate()).padStart(2, '0');
    const mm  = String(d.getMonth() + 1).padStart(2, '0');
    const yy  = d.getFullYear();
    const hh  = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Stock endommagé', href: '/stock' },
];

export default function Stock({ records, totalQty, filters: sf }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const [search, setSearch] = useState(sf.search);

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
    }, [props.flash?.success]);

    const apply = () => {
        router.get('/stock', { search: search || undefined }, { replace: true });
    };

    const clear = () => {
        setSearch('');
        router.get('/stock', {}, { replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock endommagé" />

            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Stock endommagé</h1>
                        <p className="text-sm text-muted-foreground">Produits retournés par les clients</p>
                    </div>
                    <div className="rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 px-5 py-3 text-right">
                        <p className="text-xs font-bold text-orange-500 dark:text-orange-400 uppercase tracking-wide mb-0.5">Unités endommagées</p>
                        <p className="text-xl font-bold font-mono text-orange-800 dark:text-orange-300">{totalQty}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-end gap-3 flex-wrap rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
                    <div className="flex-1 min-w-48">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Recherche</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && apply()}
                                placeholder="Produit, client…"
                                className="pl-9 w-full rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        </div>
                    </div>
                    <Button size="sm" className="rounded-xl bg-orange-600 hover:bg-orange-700" onClick={apply}>
                        Rechercher
                    </Button>
                    {search && (
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={clear}>
                            <X className="h-3.5 w-3.5 mr-1" /> Réinitialiser
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-orange-50 dark:bg-orange-950/20 text-xs font-bold uppercase text-muted-foreground border-b border-orange-100 dark:border-orange-900/50">
                                <tr>
                                    <th className="px-5 py-3 text-left">Date &amp; Heure</th>
                                    <th className="px-5 py-3 text-left">Produit</th>
                                    <th className="px-5 py-3 text-center w-24">Quantité</th>
                                    <th className="px-5 py-3 text-left">Client</th>
                                    <th className="px-5 py-3 text-left">Fournisseur</th>
                                    <th className="px-5 py-3 w-28 text-center">Retour</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {records.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">
                                            <Warehouse className="w-10 h-10 mx-auto opacity-20 mb-2" />
                                            <p>Aucun article endommagé enregistré</p>
                                        </td>
                                    </tr>
                                ) : records.data.map((r, idx) => (
                                    <tr key={r.id}
                                        className={`hover:bg-accent transition-colors ${idx % 2 !== 0 ? 'bg-muted/40' : ''}`}>
                                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                                            {fmtDT(r.created_at)}
                                        </td>
                                        <td className="px-5 py-3 font-medium text-foreground">{r.product_name}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="inline-block rounded-full bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 font-bold font-mono text-xs px-2.5 py-0.5">
                                                {r.quantity}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <button type="button"
                                                onClick={() => router.visit(`/clients/${r.client_uuid}/ledger`)}
                                                className="font-medium text-foreground/90 hover:text-orange-600 dark:hover:text-orange-400 hover:underline text-left flex items-center gap-1">
                                                {r.client_nom}
                                                <ExternalLink className="h-3 w-3 opacity-50" />
                                            </button>
                                        </td>
                                        <td className="px-5 py-3">
                                            {r.supplier_nom ? (
                                                <button type="button"
                                                    onClick={() => router.visit(`/suppliers/${r.supplier_uuid}`)}
                                                    className="font-medium text-foreground/90 hover:text-blue-600 dark:hover:text-blue-400 hover:underline text-left flex items-center gap-1">
                                                    <Truck className="h-3.5 w-3.5 opacity-60 shrink-0" />
                                                    {r.supplier_nom}
                                                </button>
                                            ) : (
                                                <span className="text-muted-foreground text-xs italic">Aucun</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            {r.supplier_uuid ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="rounded-lg h-7 px-2.5 text-xs border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                                    onClick={() => router.visit(`/suppliers/${r.supplier_uuid}/return`)}>
                                                    <RotateCcw className="h-3 w-3 mr-1" />
                                                    Retourner
                                                </Button>
                                            ) : (
                                                <span className="text-muted-foreground/40 text-xs">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {records.last_page > 1 && (
                        <div className="border-t border-border/60 bg-muted/40 px-5 py-3 flex items-center gap-1">
                            {records.links.map((link, i) => (
                                <button key={i} disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                    className={`min-w-8 h-8 rounded-lg text-xs font-semibold transition-colors px-2 ${
                                        link.active
                                            ? 'bg-orange-600 text-white'
                                            : link.url
                                            ? 'text-muted-foreground hover:bg-accent'
                                            : 'text-muted-foreground/40 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
