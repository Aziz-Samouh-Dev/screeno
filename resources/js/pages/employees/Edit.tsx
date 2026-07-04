import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const POSTES = ['Gérant', 'Comptable', 'Magasinier', 'Caissière', 'Vendeur', 'Vendeuse', 'Livreur', 'Technicien', 'Commercial', 'Autre'];

const COLORS = [
    'bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700',
];
const initials  = (n: string) => n.trim().split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
const avatarClr = (n: string) => n ? COLORS[n.charCodeAt(0) % COLORS.length] : 'bg-muted text-muted-foreground';

interface Employee {
    uuid: string; nom: string; email: string | null; telephone: string | null;
    poste: string; salaire_brut: number; date_embauche: string;
    cnss: string | null; status: 'actif' | 'inactif';
}

export default function EmployeeEdit() {
    const { employee } = usePage().props as unknown as { employee: Employee };
    const { props } = usePage<{ errors?: Record<string, string> }>();
    const errors = props.errors ?? {};

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Employés', href: '/employees' },
        { title: employee.nom, href: `/employees/${employee.uuid}/edit` },
    ];

    const [form, setForm] = useState({
        nom: employee.nom,
        email: employee.email ?? '',
        telephone: employee.telephone ?? '',
        poste: employee.poste,
        salaire_brut: String(employee.salaire_brut),
        date_embauche: employee.date_embauche,
        cnss: employee.cnss ?? '',
        status: employee.status,
    });
    const [processing, setProcessing] = useState(false);

    function set(field: string, value: string) {
        setForm(f => ({ ...f, [field]: value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        router.put(`/employees/${employee.uuid}`, {
            ...form,
            salaire_brut: parseFloat(form.salaire_brut) || 0,
        }, { onFinish: () => setProcessing(false) });
    }

    const ini = initials(form.nom);
    const clr = avatarClr(form.nom);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier · ${employee.nom}`} />
            <div className="flex flex-col gap-6 p-6 max-w-4xl">

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl"
                        onClick={() => router.visit('/employees')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Modifier un employé</h1>
                        <p className="text-sm text-muted-foreground">{employee.nom}</p>
                    </div>
                </div>

                {Object.keys(errors).length > 0 && (
                    <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{Object.values(errors)[0]}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Avatar preview */}
                        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center gap-3">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black ${clr}`}>
                                {ini}
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-foreground text-sm">{form.nom || 'Nom de l\'employé'}</p>
                                <p className="text-xs text-muted-foreground">{form.poste}</p>
                            </div>
                            {form.salaire_brut && (
                                <p className="text-sm font-mono font-bold text-violet-600 dark:text-violet-400">
                                    {Number(form.salaire_brut).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                                </p>
                            )}
                        </div>

                        {/* Form */}
                        <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Nom complet *</label>
                                    <Input value={form.nom} onChange={e => set('nom', e.target.value)}
                                        placeholder="Prénom Nom" className="rounded-xl h-9" required />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Poste *</label>
                                    <Select value={form.poste} onValueChange={v => set('poste', v)}>
                                        <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {POSTES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Email</label>
                                    <Input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                                        placeholder="prenom@screeno.ma" className="rounded-xl h-9" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Téléphone</label>
                                    <Input value={form.telephone} onChange={e => set('telephone', e.target.value)}
                                        placeholder="+212 6XX-XXXXXX" className="rounded-xl h-9" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Salaire brut mensuel *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">MAD</span>
                                        <Input type="number" step="0.01" min={0} value={form.salaire_brut}
                                            onChange={e => set('salaire_brut', e.target.value)}
                                            className="rounded-xl h-9 pl-12 text-right" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Date d'embauche</label>
                                    <Input type="date" value={form.date_embauche}
                                        onChange={e => set('date_embauche', e.target.value)}
                                        className="rounded-xl h-9" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">N° CNSS</label>
                                    <Input value={form.cnss} onChange={e => set('cnss', e.target.value)}
                                        placeholder="110XXXXXX" className="rounded-xl h-9" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Statut</label>
                                    <Select value={form.status} onValueChange={v => set('status', v)}>
                                        <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="actif">Actif</SelectItem>
                                            <SelectItem value="inactif">Inactif</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" className="rounded-xl"
                                    onClick={() => router.visit('/employees')}>Annuler</Button>
                                <Button type="submit" disabled={processing} className="rounded-xl bg-blue-600 hover:bg-blue-700 px-6">
                                    {processing ? 'Enregistrement…' : 'Mettre à jour'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
