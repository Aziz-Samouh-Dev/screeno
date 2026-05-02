import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { useState } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin, FileText, CheckCircle2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Clients', href: '/clients' },
    { title: 'Nouveau client', href: '/clients/create' },
];

const formSchema = z.object({
    nom:       z.string().min(1, { message: 'Le nom est requis' }),
    email:     z.string().email({ message: 'E-mail invalide' }).optional().or(z.literal('')),
    telephone: z.string().min(1, { message: 'Le téléphone est requis' }).regex(/^[0-9+\-\s]+$/, { message: 'Téléphone invalide' }),
    adresse:   z.string().optional(),
    ville:     z.string().optional(),
    notes:     z.string().optional(),
    status:    z.enum(['active', 'inactive']),
});

type FormValues = z.infer<typeof formSchema>;

export default function Create() {
    const [processing, setProcessing] = useState(false);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: { nom: '', email: '', telephone: '', adresse: '', ville: '', notes: '', status: 'active' },
    });

    const watchedNom = form.watch('nom');
    const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

    function onSubmit(values: FormValues) {
        router.post('/clients', values, {
            onStart:  () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onError:  (errors) => setServerErrors(errors),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouveau client" />

            <div className="flex flex-col gap-6 p-6">

                {/* HEADER */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.visit('/clients')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Nouveau client</h1>
                        <p className="text-sm text-muted-foreground">Ajouter un nouveau client à votre CRM</p>
                    </div>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* SIDEBAR */}
                    <div className="space-y-4">
                        {/* Avatar preview */}
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col items-center gap-3">
                            <div className="h-20 w-20 rounded-3xl bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 flex items-center justify-center text-2xl font-bold">
                                {watchedNom ? getInitials(watchedNom) : <User className="h-8 w-8 opacity-40" />}
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-foreground">{watchedNom || 'Client Name'}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{form.watch('email') || 'email@example.com'}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                                form.watch('status') === 'active'
                                    ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/60'
                                    : 'bg-red-50 dark:bg-red-950/40 text-red-600 border-red-200 dark:border-red-900/60'
                            }`}>
                                {form.watch('status')}
                            </span>
                        </div>

                        {/* Tips */}
                        <div className="rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 p-4 text-xs text-blue-700 dark:text-blue-400 space-y-2">
                            <p className="font-bold">Conseils</p>
                            <p>• Le nom et le téléphone sont obligatoires.</p>
                            <p>• L'e-mail doit être unique parmi les clients.</p>
                            <p>• Vous pouvez ajouter des factures après enregistrement.</p>
                        </div>
                    </div>

                    {/* FORM */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Basic Info */}
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
                            <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-bold text-foreground">Informations de base</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Controller control={form.control} name="nom" render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                                        <FieldLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Nom complet *</FieldLabel>
                                        <Input placeholder="e.g. John Doe" className="rounded-xl" {...field} />
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                        {serverErrors.nom && <p className="text-xs text-red-500">{serverErrors.nom}</p>}
                                    </Field>
                                )} />

                                <Controller control={form.control} name="status" render={({ field }) => (
                                    <Field className="flex flex-col gap-1.5">
                                        <FieldLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Statut</FieldLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Actif</SelectItem>
                                                <SelectItem value="inactive">Inactif</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                )} />
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
                            <div className="flex items-center gap-2 mb-1">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-bold text-foreground">Coordonnées</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Controller control={form.control} name="email" render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                                        <FieldLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Email</FieldLabel>
                                        <Input type="email" placeholder="client@email.com" className="rounded-xl" {...field} />
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                        {serverErrors.email && <p className="text-xs text-red-500">{serverErrors.email}</p>}
                                    </Field>
                                )} />

                                <Controller control={form.control} name="telephone" render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                                        <FieldLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Téléphone *</FieldLabel>
                                        <Input type="tel" placeholder="0600000000" className="rounded-xl" {...field}
                                            onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                                const t = e.target as HTMLInputElement;
                                                t.value = t.value.replace(/[^0-9+\-\s]/g, '');
                                                field.onChange(t.value);
                                            }}
                                        />
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )} />
                            </div>
                        </div>

                        {/* Location */}
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-bold text-foreground">Localisation</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Controller control={form.control} name="ville" render={({ field }) => (
                                    <Field className="flex flex-col gap-1.5">
                                        <FieldLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Ville</FieldLabel>
                                        <Input placeholder="Casablanca" className="rounded-xl" {...field} />
                                    </Field>
                                )} />

                                <Controller control={form.control} name="adresse" render={({ field }) => (
                                    <Field className="sm:col-span-1 flex flex-col gap-1.5">
                                        <FieldLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Adresse</FieldLabel>
                                        <Input placeholder="Street, building…" className="rounded-xl" {...field} />
                                    </Field>
                                )} />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-bold text-foreground">Notes</h3>
                            </div>
                            <Controller control={form.control} name="notes" render={({ field }) => (
                                <Textarea
                                    className="rounded-xl resize-none h-24"
                                    placeholder="Internal notes about this client…"
                                    {...field}
                                />
                            )} />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" className="rounded-xl px-6"
                                onClick={() => router.visit('/clients')} disabled={processing}>
                                Annuler
                            </Button>
                            <Button type="submit" className="rounded-xl px-6" disabled={processing}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {processing ? 'Enregistrement…' : 'Créer le client'}
                            </Button>
                        </div>
                    </div>

                </form>
            </div>
        </AppLayout>
    );
}
