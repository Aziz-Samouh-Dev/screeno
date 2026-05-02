import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from '@inertiajs/react';
import { Building2, MapPin, Phone, Mail, Hash, Save } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const schema = z.object({
    name:    z.string().min(1, 'Le nom est requis'),
    address: z.string().optional(),
    city:    z.string().optional(),
    country: z.string().optional(),
    phone:   z.string().optional(),
    email:   z.string().email().optional().or(z.literal('')),
    tax_id:  z.string().optional(),
    ice:     z.string().optional(),
    notes:   z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Paramètres', href: '/settings/profile' },
    { title: "Profil d'entreprise", href: '/settings/company' },
];

export default function CompanyPage() {
    const { company } = usePage().props as any;

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            name:    company?.name    ?? '',
            address: company?.address ?? '',
            city:    company?.city    ?? '',
            country: company?.country ?? '',
            phone:   company?.phone   ?? '',
            email:   company?.email   ?? '',
            tax_id:  company?.tax_id  ?? '',
            ice:     company?.ice     ?? '',
            notes:   company?.notes   ?? '',
        },
    });

    function onSubmit(values: FormValues) {
        router.put('/settings/company', values);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profil d'entreprise" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold">Profil d'entreprise</h2>
                        <p className="text-sm text-muted-foreground">Ces données apparaissent sur tous les documents imprimés.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {/* Identity */}
                        <div className="rounded-lg border bg-card p-5 space-y-4">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" /> Identité
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2 space-y-2">
                                    <Label>Nom de l'entreprise *</Label>
                                    <Input {...register('name')} placeholder="Screeno SARL" />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Identifiant fiscal (IF / RC)</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input {...register('tax_id')} className="pl-9" placeholder="123456789" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>ICE</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input {...register('ice')} className="pl-9" placeholder="000000000000000" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="rounded-lg border bg-card p-5 space-y-4">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" /> Contact
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Téléphone</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input {...register('phone')} className="pl-9" placeholder="+212 6xx xxx xxx" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input {...register('email')} type="email" className="pl-9" placeholder="contact@company.ma" />
                                    </div>
                                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="rounded-lg border bg-card p-5 space-y-4">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" /> Adresse
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2 space-y-2">
                                    <Label>Rue</Label>
                                    <Input {...register('address')} placeholder="123 Avenue Hassan II" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ville</Label>
                                    <Input {...register('city')} placeholder="Casablanca" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Pays</Label>
                                    <Input {...register('country')} placeholder="Maroc" />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="rounded-lg border bg-card p-5 space-y-3">
                            <Label>Notes (apparaît sur les documents)</Label>
                            <Textarea {...register('notes')} className="resize-none h-24" placeholder="Conditions de paiement, coordonnées bancaires, etc." />
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                <Save className="mr-2 h-4 w-4" /> Enregistrer
                            </Button>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
