import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Pencil, Trash2, Plus, CheckCircle2, XCircle } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

export type PaymentMethod = {
    uuid: string;
    name: string;
    code: string;
    description?: string;
    is_active: boolean;
    created_at: string;
};

type Props = {
    paymentMethods: {
        data: PaymentMethod[];
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Paramètres', href: '/settings/profile' },
    { title: 'Moyens de paiement', href: '/settings/payment_methods' },
];

export default function PaymentMethods({ paymentMethods }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<PaymentMethod | null>(null);

    const createForm = useForm({ name: '', code: '', description: '', is_active: true });
    const editForm   = useForm({ name: '', code: '', description: '', is_active: true });

    function openCreate() {
        createForm.reset();
        setShowCreate(true);
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/settings/payment_methods', {
            onSuccess: () => { setShowCreate(false); createForm.reset(); },
        });
    }

    function openEdit(m: PaymentMethod) {
        editForm.setData({ name: m.name, code: m.code, description: m.description ?? '', is_active: m.is_active });
        setEditTarget(m);
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editTarget) return;
        editForm.put(`/settings/payment_methods/${editTarget.uuid}`, {
            onSuccess: () => { setEditTarget(null); editForm.reset(); },
        });
    }

    function deleteMethod(m: PaymentMethod) {
        if (!confirm(`Supprimer "${m.name}" ?`)) return;
        router.delete(`/settings/payment_methods/${m.uuid}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Moyens de paiement" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Moyens de paiement</h2>
                            <p className="text-sm text-muted-foreground">Gérez les modes de règlement disponibles.</p>
                        </div>
                        <Button onClick={openCreate} size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter
                        </Button>
                    </div>

                    <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Nom</th>
                                    <th className="px-4 py-3 text-left font-medium">Code</th>
                                    <th className="px-4 py-3 text-left font-medium">Description</th>
                                    <th className="px-4 py-3 text-left font-medium">Statut</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {paymentMethods.data.map((m) => (
                                    <tr key={m.uuid} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">{m.name}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono">{m.code}</span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{m.description || '—'}</td>
                                        <td className="px-4 py-3">
                                            {m.is_active ? (
                                                <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> Actif
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground gap-1">
                                                    <XCircle className="h-3 w-3" /> Inactif
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                                    onClick={() => deleteMethod(m)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {paymentMethods.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            Aucun moyen de paiement trouvé.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create Dialog */}
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nouveau moyen de paiement</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submitCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nom</Label>
                                <Input value={createForm.data.name} onChange={e => createForm.setData('name', e.target.value)} placeholder="Espèces" />
                                <InputError message={createForm.errors.name} />
                            </div>
                            <div className="space-y-2">
                                <Label>Code</Label>
                                <Input value={createForm.data.code} onChange={e => createForm.setData('code', e.target.value.toUpperCase())} placeholder="CASH" className="font-mono" />
                                <InputError message={createForm.errors.code} />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input value={createForm.data.description} onChange={e => createForm.setData('description', e.target.value)} placeholder="Optionnel" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Switch checked={createForm.data.is_active} onCheckedChange={v => createForm.setData('is_active', v)} />
                                <Label>Actif</Label>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                                <Button type="submit" disabled={createForm.processing}>Créer</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={!!editTarget} onOpenChange={open => { if (!open) setEditTarget(null); }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Modifier le moyen de paiement</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nom</Label>
                                <Input value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} />
                                <InputError message={editForm.errors.name} />
                            </div>
                            <div className="space-y-2">
                                <Label>Code</Label>
                                <Input value={editForm.data.code} disabled className="font-mono bg-muted" />
                                <p className="text-xs text-muted-foreground">Le code ne peut pas être modifié.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)} />
                            </div>
                            <div className="flex items-center gap-3">
                                <Switch checked={editForm.data.is_active} onCheckedChange={v => editForm.setData('is_active', v)} />
                                <Label>Actif</Label>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Annuler</Button>
                                <Button type="submit" disabled={editForm.processing}>Enregistrer</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </SettingsLayout>
        </AppLayout>
    );
}
