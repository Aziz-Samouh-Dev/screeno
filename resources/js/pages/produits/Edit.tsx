import { Head, router, usePage } from '@inertiajs/react';
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
import { toast } from 'sonner';
import {
    ArrowLeft, Package, Upload, DollarSign,
    BarChart3, Save, Eye, X, TrendingUp, Tag, Truck,
} from 'lucide-react';

const formSchema = z.object({
    nom:                   z.string().min(1, { message: 'Product name is required' }),
    image:                 z.any().optional(),
    description:           z.string().optional(),
    purchase_price:        z.preprocess(v => Number(v), z.number().min(0)),
    sale_price:            z.preprocess(v => Number(v), z.number().min(0)),
    stock_quantity:        z.preprocess(v => Number(v), z.number().min(0)),
    stock_alert_threshold: z.preprocess(v => Number(v), z.number().min(0)),
    supplier_id:           z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Edit() {
    const { produit, suppliers } = usePage().props as any;
    const [processing, setProcessing] = useState(false);
    const [preview, setPreview]       = useState<string | null>(produit.image ? `/storage/${produit.image}` : null);
    const [removeImage, setRemoveImage] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Products', href: '/produits' },
        { title: produit.nom, href: `/produits/${produit.uuid}` },
        { title: 'Edit', href: `/produits/${produit.uuid}/edit` },
    ];

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            nom:                   produit.nom                   ?? '',
            description:           produit.description           ?? '',
            image:                 null,
            purchase_price:        produit.purchase_price        ?? 0,
            sale_price:            produit.sale_price            ?? 0,
            stock_quantity:        produit.stock_quantity        ?? 0,
            stock_alert_threshold: produit.stock_alert_threshold ?? 10,
            supplier_id:           produit.supplier_id ?? '',
        },
    });

    const watchPurchase = form.watch('purchase_price');
    const watchSale     = form.watch('sale_price');
    const margin        = Number(watchSale) - Number(watchPurchase);
    const marginPct     = Number(watchPurchase) > 0 ? (margin / Number(watchPurchase)) * 100 : 0;

    function onSubmit(values: FormValues) {
        const fd = new FormData();
        fd.append('_method',               'put');
        fd.append('nom',                   values.nom);
        fd.append('description',           values.description ?? '');
        fd.append('purchase_price',        String(values.purchase_price));
        fd.append('sale_price',            String(values.sale_price));
        fd.append('stock_quantity',        String(values.stock_quantity));
        fd.append('stock_alert_threshold', String(values.stock_alert_threshold ?? 10));

        if (values.supplier_id) fd.append('supplier_id', String(values.supplier_id));
        if (values.image)  fd.append('image', values.image);
        else if (removeImage) fd.append('image', '');

        router.post(`/produits/${produit.uuid}`, fd, {
            forceFormData: true,
            onStart:  () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onError:  (errors) => {
                const first = Object.values(errors)[0];
                toast.error(first ?? 'Veuillez corriger les erreurs ci-dessous.');
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit · ${produit.nom}`} />

            <div className="flex flex-col gap-6 p-6">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.visit(`/produits/${produit.uuid}`)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Modifier le produit</h1>
                            <p className="text-sm text-muted-foreground">Modifier {produit.nom}</p>
                        </div>
                    </div>
                    <Button variant="outline" className="rounded-xl" onClick={() => router.visit(`/produits/${produit.uuid}`)}>
                        <Eye className="mr-2 h-4 w-4" /> View Product
                    </Button>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* SIDEBAR */}
                    <div className="space-y-4">

                        {/* Image */}
                        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                <Upload className="h-4 w-4 text-muted-foreground" /> Image du produit
                            </h3>
                            <Controller control={form.control} name="image" render={({ field: { onChange } }) => (
                                <label className="cursor-pointer block">
                                    <div className={`relative aspect-square rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center transition-colors ${preview ? 'border-transparent' : 'border-border hover:border-muted-foreground/50 bg-muted/40'}`}>
                                        {preview ? (
                                            <>
                                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                                <button type="button"
                                                    className="absolute top-2 right-2 rounded-full bg-card/90 p-1 shadow hover:bg-card"
                                                    onClick={e => { e.preventDefault(); setPreview(null); onChange(null); setRemoveImage(true); }}>
                                                    <X className="h-4 w-4 text-muted-foreground" />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-center space-y-2 p-4">
                                                <Upload className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                                                <p className="text-xs text-muted-foreground">Cliquez pour télécharger</p>
                                                <p className="text-xs text-muted-foreground/60">PNG, JPG, WEBP</p>
                                            </div>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) { onChange(file); setPreview(URL.createObjectURL(file)); setRemoveImage(false); }
                                    }} />
                                </label>
                            )} />
                        </div>

                        {/* SKU */}
                        <div className="rounded-2xl border border-border bg-muted/40 p-4 flex items-center gap-3">
                            <div className="rounded-lg bg-card p-2 shadow-sm">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">SKU</p>
                                <p className="font-mono font-semibold text-foreground/90">{produit.sku}</p>
                            </div>
                        </div>

                        {/* Margin */}
                        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-2">
                            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" /> Aperçu marge
                            </h3>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Achat</span>
                                    <span className="font-mono font-semibold text-foreground">{Number(watchPurchase).toFixed(2)} MAD</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Vente</span>
                                    <span className="font-mono font-semibold text-foreground">{Number(watchSale).toFixed(2)} MAD</span>
                                </div>
                                <div className="border-t border-border pt-1.5 flex justify-between">
                                    <span className="font-bold text-foreground/90">Marge</span>
                                    <span className={`font-mono font-bold ${margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                        {margin >= 0 ? '+' : ''}{margin.toFixed(2)} MAD
                                        {Number(watchPurchase) > 0 && <span className="ml-1">({marginPct.toFixed(1)}%)</span>}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FORM */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Basic */}
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" /> Informations de base
                            </h3>
                            <Controller control={form.control} name="nom" render={({ field, fieldState }) => (
                                <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                                    <FieldLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Nom du produit *</FieldLabel>
                                    <Input className="rounded-xl" {...field} />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )} />
                            <Controller control={form.control} name="description" render={({ field }) => (
                                <Field className="flex flex-col gap-1.5">
                                    <FieldLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Description</FieldLabel>
                                    <Textarea className="rounded-xl resize-none h-24" {...field} />
                                </Field>
                            )} />
                            <Controller control={form.control} name="supplier_id" render={({ field }) => (
                                <Field className="flex flex-col gap-1.5">
                                    <FieldLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Fournisseur</FieldLabel>
                                    <Select value={String(field.value || '')} onValueChange={v => field.onChange(v ? Number(v) : null)}>
                                        <SelectTrigger className="rounded-xl h-10">
                                            <SelectValue placeholder="Sélectionner un fournisseur" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers?.map((s: any) => (
                                                <SelectItem key={s.id} value={String(s.id)}>{s.nom}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                            )} />
                        </div>

                        {/* Pricing */}
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" /> Prix
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Controller control={form.control} name="purchase_price" render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                                        <FieldLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Prix d'achat</FieldLabel>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">MAD</span>
                                            <Input type="number" step="0.01" min="0" className="rounded-xl pl-12" {...field} />
                                        </div>
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )} />
                                <Controller control={form.control} name="sale_price" render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                                        <FieldLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Prix de vente</FieldLabel>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">MAD</span>
                                            <Input type="number" step="0.01" min="0" className="rounded-xl pl-12" {...field} />
                                        </div>
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )} />
                            </div>
                        </div>

                        {/* Stock */}
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-muted-foreground" /> Stock
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Controller control={form.control} name="stock_quantity" render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                                        <FieldLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Quantité en stock</FieldLabel>
                                        <Input type="number" min="0" className="rounded-xl"
                                            value={field.value} onChange={e => field.onChange(Number(e.target.value))} />
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )} />
                                <Controller control={form.control} name="stock_alert_threshold" render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                                        <FieldLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Seuil alerte stock</FieldLabel>
                                        <Input type="number" min="0" placeholder="10" className="rounded-xl"
                                            value={field.value} onChange={e => field.onChange(Number(e.target.value))} />
                                        <p className="text-[11px] text-muted-foreground">Alerte si stock ≤ ce seuil</p>
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )} />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" className="rounded-xl px-6"
                                onClick={() => router.visit(`/produits/${produit.uuid}`)} disabled={processing}>
                                Annuler
                            </Button>
                            <Button type="submit" className="rounded-xl px-6" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? 'Enregistrement…' : 'Enregistrer'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
