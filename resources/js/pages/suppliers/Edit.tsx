import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Fournisseurs', href: '/suppliers' },
    { title: 'Modifier le fournisseur', href: '/suppliers' },
];

const formSchema = z.object({
    nom: z.string().min(1, { message: 'Le nom du fournisseur est requis' }),
    email: z.string().email().optional(),
    telephone: z
        .string()
        .min(1, { message: 'Le téléphone est requis' })
        .regex(/^[0-9]+$/, { message: 'Le téléphone ne doit contenir que des chiffres' }),
    adresse: z.string().optional(),
    ville: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['active', 'inactive']),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditSupplier() {
    const { supplier } = usePage().props as any; // supplier from server
    const [processing, setProcessing] = useState(false);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            nom: supplier.nom ?? '',
            email: supplier.email ?? '',
            telephone: supplier.telephone ?? '',
            adresse: supplier.adresse ?? '',
            ville: supplier.ville ?? '',
            notes: supplier.notes ?? '',
            status: supplier.status ?? 'active',
        },
    });

    function onSubmit(values: FormValues) {
        const formData = new FormData();

        formData.append('_method', 'put');
        formData.append('nom', values.nom);
        formData.append('telephone', values.telephone);
        formData.append('email', values.email ?? '');
        formData.append('adresse', values.adresse ?? '');
        formData.append('ville', values.ville ?? '');
        formData.append('notes', values.notes ?? '');
        formData.append('status', values.status);

        router.post(`/suppliers/${supplier.uuid}`, formData, {
            forceFormData: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onError: (errors) => setServerErrors(errors),
        });
    }

    function onReset() {
        form.reset();
        form.clearErrors();
        setServerErrors({});
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Modifier le fournisseur" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative overflow-hidden rounded-xl border p-6">
                    <form onSubmit={form.handleSubmit(onSubmit)} onReset={onReset} className="space-y-8">
                        <div className="grid grid-cols-12 gap-4">

                            {/* Header */}
                            <div className="col-span-12">
                                <p className="leading-7">
                                    <span className="text-lg font-semibold">Modifier le fournisseur</span>
                                    <br />
                                    <span className="text-sm text-muted-foreground">
                                        Modifier les informations du fournisseur.
                                    </span>
                                </p>
                            </div>

                            {/* Name */}
                            <Controller
                                control={form.control}
                                name="nom"
                                render={({ field, fieldState }) => (
                                    <Field
                                        className="col-span-12 lg:col-span-6 flex flex-col gap-2"
                                        data-invalid={fieldState.invalid}
                                    >
                                        <FieldLabel>Nom complet *</FieldLabel>
                                        <Input placeholder="Nom du fournisseur" {...field} />
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )}
                            />

                            {/* Email */}
                            <Controller
                                control={form.control}
                                name="email"
                                render={({ field, fieldState }) => (
                                    <Field
                                        className="col-span-12 lg:col-span-6 flex flex-col gap-2"
                                        data-invalid={fieldState.invalid}
                                    >
                                        <FieldLabel>Email</FieldLabel>
                                        <Input type="email" placeholder="supplier@email.com" {...field} />
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )}
                            />

                            {/* Phone */}
                            <Controller
                                control={form.control}
                                name="telephone"
                                render={({ field, fieldState }) => (
                                    <Field
                                        className="col-span-12 lg:col-span-6 flex flex-col gap-2"
                                        data-invalid={fieldState.invalid}
                                    >
                                        <FieldLabel>Téléphone *</FieldLabel>
                                        <Input
                                            type="tel"
                                            placeholder="Entrez le numéro de téléphone"
                                            {...field}
                                            onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                                const target = e.target as HTMLInputElement;
                                                target.value = target.value.replace(/\D/g, '');
                                                field.onChange(target.value);
                                            }}
                                        />
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )}
                            />

                            {/* Status */}
                            <Controller
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <Field className="col-span-12 lg:col-span-6 flex flex-col gap-2">
                                        <FieldLabel>Statut</FieldLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choisir un statut" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Actif</SelectItem>
                                                <SelectItem value="inactive">Inactif</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                )}
                            />

                            {/* Address */}
                            <Controller
                                control={form.control}
                                name="adresse"
                                render={({ field }) => (
                                    <Field className="col-span-12 flex flex-col gap-2">
                                        <FieldLabel>Adresse</FieldLabel>
                                        <Textarea className="h-20" placeholder="Rue, bâtiment..." {...field} />
                                    </Field>
                                )}
                            />

                            {/* City */}
                            <Controller
                                control={form.control}
                                name="ville"
                                render={({ field }) => (
                                    <Field className="col-span-12 lg:col-span-6 flex flex-col gap-2">
                                        <FieldLabel>Ville</FieldLabel>
                                        <Input placeholder="Casablanca" {...field} />
                                    </Field>
                                )}
                            />

                            {/* Notes */}
                            <Controller
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <Field className="col-span-12 flex flex-col gap-2">
                                        <FieldLabel>Notes</FieldLabel>
                                        <Textarea className="h-28" placeholder="Notes internes..." {...field} />
                                    </Field>
                                )}
                            />

                            {/* Actions */}
                            <div className="col-span-12 border-t pt-6 mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                    disabled={processing}
                                    className="w-full sm:w-40"
                                >
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={processing} className="w-full sm:w-40">
                                    {processing ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>
                            </div>
                            
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}