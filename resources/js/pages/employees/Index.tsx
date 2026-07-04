import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';
import { Users, UserCheck, Calendar, CreditCard, Clock, Pencil, Trash2, BadgeCheck, Plus, UserX } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Employés', href: '/employees' }];

interface Employee {
    uuid: string; nom: string; email: string | null; telephone: string | null;
    poste: string; salaire_brut: number; date_embauche: string;
    cnss: string | null; status: 'actif' | 'inactif';
    paie_status: 'paye' | 'en_attente' | 'inactif';
}
interface Stats {
    effectif_actif: number; inactif_count: number;
    masse_salariale: number; payes_ce_mois: number;
    total_employes: number; en_attente: number;
}

const fmt = (n: number) =>
    Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD';

const COLORS = [
    'bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700',
];
const initials  = (n: string) => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
const avatarClr = (n: string) => COLORS[n.charCodeAt(0) % COLORS.length];

export default function EmployeesIndex() {
    const { employees, stats, currentMonth } = usePage().props as unknown as {
        employees: Employee[]; stats: Stats; currentMonth: string;
    };

    const [processing, setProcessing] = useState<string | null>(null);
    const { confirmState, confirm, closeConfirm } = useConfirmDialog();

    function handlePay(emp: Employee) {
        setProcessing(emp.uuid);
        router.post(`/employees/${emp.uuid}/pay`, {}, {
            onFinish: () => setProcessing(null),
        });
    }

    function handlePayAll() {
        confirm({
            title: 'Lancer la paie ?',
            description: `Tous les employés actifs sans paiement ce mois (${stats.en_attente} en attente) seront marqués comme payés.`,
            onConfirm: () => {
                router.post('/employees/pay-all', {}, { onFinish: closeConfirm });
            },
        });
    }

    function handleDelete(emp: Employee) {
        confirm({
            title: 'Supprimer cet employé ?',
            description: `« ${emp.nom} » et toutes ses données seront supprimés définitivement.`,
            onConfirm: () => {
                router.delete(`/employees/${emp.uuid}`, { onFinish: closeConfirm });
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employés" />
            <ConfirmDialog open={confirmState.open} onOpenChange={closeConfirm}
                title={confirmState.title} description={confirmState.description}
                onConfirm={confirmState.onConfirm} />

            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Employés</h1>
                        <p className="text-sm text-muted-foreground">Effectif, paie et masse salariale</p>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                            onClick={handlePayAll} disabled={stats.en_attente === 0}>
                            <BadgeCheck className="h-3.5 w-3.5 mr-1.5" /> Lancer la paie
                        </Button>
                        <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700"
                            onClick={() => router.visit('/employees/create')}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Nouvel employé
                        </Button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Effectif actif</p>
                            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40">
                                <Users className="h-4 w-4 text-blue-500" />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-foreground">{stats.effectif_actif}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stats.inactif_count > 0 ? `${stats.inactif_count} inactif(s)` : 'Tous actifs'}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Masse salariale</p>
                            <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40">
                                <Calendar className="h-4 w-4 text-violet-500" />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-violet-600 dark:text-violet-400 font-mono">{fmt(stats.masse_salariale)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Brut mensuel</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Payés ce mois</p>
                            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                                <UserCheck className="h-4 w-4 text-emerald-500" />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            {stats.payes_ce_mois} / {stats.effectif_actif}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{currentMonth}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">En attente</p>
                            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40">
                                <Clock className="h-4 w-4 text-amber-500" />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.en_attente}</p>
                        <p className="text-xs text-muted-foreground mt-1">Salaires à verser</p>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                                <tr>
                                    <th className="px-4 py-3 text-left">Employé</th>
                                    <th className="px-4 py-3 text-left w-28">Poste</th>
                                    <th className="px-4 py-3 text-left w-32">Embauché le</th>
                                    <th className="px-4 py-3 text-right w-36">Salaire brut</th>
                                    <th className="px-4 py-3 text-center w-28">Paie</th>
                                    <th className="px-4 py-3 w-28" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {employees.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                                            <Users className="w-8 h-8 mx-auto opacity-20 mb-2" />
                                            <p>Aucun employé enregistré.</p>
                                        </td>
                                    </tr>
                                ) : employees.map(emp => (
                                    <tr key={emp.uuid} className="hover:bg-accent/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarClr(emp.nom)}`}>
                                                    {initials(emp.nom)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{emp.nom}</p>
                                                    {emp.email && <p className="text-xs text-muted-foreground">{emp.email}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                                                {emp.poste}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{emp.date_embauche}</td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-sm">{fmt(emp.salaire_brut)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {emp.paie_status === 'paye' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                                                    ● Payé
                                                </span>
                                            ) : emp.paie_status === 'en_attente' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                                                    ● En attente
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                                                    Inactif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 justify-end">
                                                {emp.paie_status === 'en_attente' && (
                                                    <button
                                                        onClick={() => handlePay(emp)}
                                                        disabled={processing === emp.uuid}
                                                        title="Payer ce mois"
                                                        className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-muted-foreground hover:text-emerald-600 transition-colors disabled:opacity-40">
                                                        <CreditCard className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button onClick={() => router.visit(`/employees/${emp.uuid}/edit`)}
                                                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleDelete(emp)}
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
