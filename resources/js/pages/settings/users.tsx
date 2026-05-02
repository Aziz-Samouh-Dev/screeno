import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import SettingsLayout from '@/layouts/settings/layout';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, ShieldCheck, User } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    created_at: string;
};

type Props = {
    users: UserRow[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Paramètres', href: '/settings/profile' },
    { title: 'Utilisateurs', href: '/settings/users' },
];

export default function UsersPage({ users }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<UserRow | null>(null);

    const createForm = useForm({
        name: '',
        email: '',
        role: 'user' as 'admin' | 'user',
        password: '',
    });

    const editForm = useForm({
        name: '',
        email: '',
        role: 'user' as 'admin' | 'user',
        password: '',
    });

    function openCreate() {
        createForm.reset();
        setShowCreate(true);
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/settings/users', {
            onSuccess: () => { setShowCreate(false); createForm.reset(); },
        });
    }

    function openEdit(user: UserRow) {
        editForm.setData({ name: user.name, email: user.email, role: user.role, password: '' });
        setEditTarget(user);
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editTarget) return;
        editForm.put(`/settings/users/${editTarget.id}`, {
            onSuccess: () => { setEditTarget(null); editForm.reset(); },
        });
    }

    function deleteUser(user: UserRow) {
        if (!confirm(`Supprimer l'utilisateur "${user.name}" ?`)) return;
        router.delete(`/settings/users/${user.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Utilisateurs" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Gestion des utilisateurs</h2>
                            <p className="text-sm text-muted-foreground">Créez et gérez les comptes utilisateurs.</p>
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
                                    <th className="px-4 py-3 text-left font-medium">Email</th>
                                    <th className="px-4 py-3 text-left font-medium">Rôle</th>
                                    <th className="px-4 py-3 text-left font-medium">Créé le</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">{user.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                        <td className="px-4 py-3">
                                            {user.role === 'admin' ? (
                                                <Badge className="bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 gap-1">
                                                    <ShieldCheck className="h-3 w-3" />
                                                    Admin
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="gap-1">
                                                    <User className="h-3 w-3" />
                                                    Utilisateur
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEdit(user)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                                    onClick={() => deleteUser(user)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            Aucun utilisateur trouvé.
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
                            <DialogTitle>Nouvel utilisateur</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submitCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nom</Label>
                                <Input
                                    value={createForm.data.name}
                                    onChange={e => createForm.setData('name', e.target.value)}
                                    placeholder="Nom complet"
                                />
                                {createForm.errors.name && (
                                    <p className="text-xs text-red-500">{createForm.errors.name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={createForm.data.email}
                                    onChange={e => createForm.setData('email', e.target.value)}
                                    placeholder="email@exemple.com"
                                />
                                {createForm.errors.email && (
                                    <p className="text-xs text-red-500">{createForm.errors.email}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Rôle</Label>
                                <Select
                                    value={createForm.data.role}
                                    onValueChange={v => createForm.setData('role', v as 'admin' | 'user')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">Utilisateur</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Mot de passe</Label>
                                <Input
                                    type="password"
                                    value={createForm.data.password}
                                    onChange={e => createForm.setData('password', e.target.value)}
                                    placeholder="Minimum 8 caractères"
                                />
                                {createForm.errors.password && (
                                    <p className="text-xs text-red-500">{createForm.errors.password}</p>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={createForm.processing}>
                                    Créer
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={!!editTarget} onOpenChange={open => { if (!open) setEditTarget(null); }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Modifier l'utilisateur</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nom</Label>
                                <Input
                                    value={editForm.data.name}
                                    onChange={e => editForm.setData('name', e.target.value)}
                                />
                                {editForm.errors.name && (
                                    <p className="text-xs text-red-500">{editForm.errors.name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={editForm.data.email}
                                    onChange={e => editForm.setData('email', e.target.value)}
                                />
                                {editForm.errors.email && (
                                    <p className="text-xs text-red-500">{editForm.errors.email}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Rôle</Label>
                                <Select
                                    value={editForm.data.role}
                                    onValueChange={v => editForm.setData('role', v as 'admin' | 'user')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">Utilisateur</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Nouveau mot de passe <span className="text-muted-foreground">(laisser vide = inchangé)</span></Label>
                                <Input
                                    type="password"
                                    value={editForm.data.password}
                                    onChange={e => editForm.setData('password', e.target.value)}
                                    placeholder="Minimum 8 caractères"
                                />
                                {editForm.errors.password && (
                                    <p className="text-xs text-red-500">{editForm.errors.password}</p>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={editForm.processing}>
                                    Enregistrer
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </SettingsLayout>
        </AppLayout>
    );
}
