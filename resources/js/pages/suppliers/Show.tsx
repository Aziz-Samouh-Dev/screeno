'use client';

import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit2, Trash2, Building2, Mail, Phone, MapPin, Calendar, FileText } from 'lucide-react';

interface Supplier {
    uuid: string;
    nom: string;
    email?: string | null;
    telephone: string;
    adresse?: string | null;
    ville?: string | null;
    pays?: string | null;
    notes?: string | null;
    status: 'active' | 'inactive';
    created_at: string;
}

interface Props {
    supplier: Supplier;
}

export default function ShowSupplier({ supplier }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Fournisseurs', href: '/suppliers' },
        { title: supplier.nom, href: `/suppliers/${supplier.uuid}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={supplier.nom} />

            <div className="flex flex-col gap-6 p-6">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <Button variant="link" onClick={() => router.visit('/suppliers')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour aux fournisseurs
                    </Button>

                    <div className="flex space-x-3">
                        <Button variant="ghost" onClick={() => router.visit(`/suppliers/${supplier.uuid}/edit`)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Modifier
                        </Button>
                        <Button variant="destructive" onClick={() => {
                            if (confirm('Supprimer ce fournisseur ?')) {
                                router.delete(`/suppliers/${supplier.uuid}`);
                            }
                        }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        </Button>
                    </div>
                </div>

                {/* INFO CARD */}
                <div className="max-w-xl bg-card rounded-3xl border border-border shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/30">
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

                    <div className="space-y-4">
                        {supplier.telephone && (
                            <div className="flex items-start gap-3">
                                <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Téléphone</p>
                                    <p className="text-sm text-foreground font-medium">{supplier.telephone}</p>
                                </div>
                            </div>
                        )}
                        {supplier.email && (
                            <div className="flex items-start gap-3">
                                <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">E-mail</p>
                                    <p className="text-sm text-foreground font-medium">{supplier.email}</p>
                                </div>
                            </div>
                        )}
                        {(supplier.adresse || supplier.ville || supplier.pays) && (
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Adresse</p>
                                    <p className="text-sm text-foreground font-medium leading-relaxed">
                                        {[supplier.adresse, supplier.ville, supplier.pays].filter(Boolean).join(', ')}
                                    </p>
                                </div>
                            </div>
                        )}
                        {supplier.notes && (
                            <div className="flex items-start gap-3">
                                <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Notes</p>
                                    <p className="text-sm text-foreground font-medium leading-relaxed">{supplier.notes}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-start gap-3">
                            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Fournisseur depuis</p>
                                <p className="text-sm text-foreground font-medium">{supplier.created_at}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
