import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    Plus, Pencil, Trash2, X, ArrowLeft, Lock,
    Building2, Users, Zap, Truck, FileText, Shield, Wifi, MoreHorizontal,
    Tag, CreditCard, Box, Briefcase, AlertCircle, Settings,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Paramètres', href: '/parametres/categories' },
    { title: 'Catégories de charges', href: '/parametres/categories' },
];

interface Category {
    uuid: string; nom: string; slug: string; color: string;
    bg_color: string; icon_name: string; sort_order: number; is_default: boolean;
}

const ICON_OPTIONS = [
    { value: 'building2',       label: 'Bâtiment',    Icon: Building2       },
    { value: 'users',           label: 'Personnes',   Icon: Users           },
    { value: 'zap',             label: 'Énergie',     Icon: Zap             },
    { value: 'truck',           label: 'Transport',   Icon: Truck           },
    { value: 'file-text',       label: 'Document',    Icon: FileText        },
    { value: 'shield',          label: 'Assurance',   Icon: Shield          },
    { value: 'wifi',            label: 'Télécom',     Icon: Wifi            },
    { value: 'tag',             label: 'Étiquette',   Icon: Tag             },
    { value: 'credit-card',     label: 'Carte',       Icon: CreditCard      },
    { value: 'box',             label: 'Boîte',       Icon: Box             },
    { value: 'briefcase',       label: 'Mallette',    Icon: Briefcase       },
    { value: 'more-horizontal', label: 'Autre',       Icon: MoreHorizontal  },
];

const COLOR_OPTIONS = [
    { color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/40',   label: 'Ambre'   },
    { color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-950/40', label: 'Violet'  },
    { color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-950/40', label: 'Orange'  },
    { color: 'text-cyan-500',    bg: 'bg-cyan-50 dark:bg-cyan-950/40',     label: 'Cyan'    },
    { color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-950/40',       label: 'Rouge'   },
    { color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40',label: 'Vert'   },
    { color: 'text-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-950/40', label: 'Indigo'  },
    { color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/40',     label: 'Bleu'    },
    { color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-950/40',     label: 'Rose'    },
    { color: 'text-teal-500',    bg: 'bg-teal-50 dark:bg-teal-950/40',     label: 'Teal'    },
    { color: 'text-slate-500',   bg: 'bg-slate-50 dark:bg-slate-800/40',   label: 'Gris'    },
];

const ICON_MAP: Record<string, React.ElementType> = Object.fromEntries(
    ICON_OPTIONS.map(o => [o.value, o.Icon])
);

function CatPreview({ nom, color, bg_color, icon_name }: Pick<Category, 'nom' | 'color' | 'bg_color' | 'icon_name'>) {
    const Icon = ICON_MAP[icon_name] ?? MoreHorizontal;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${bg_color} ${color}`}>
            <Icon className="w-3 h-3" /> {nom || 'Aperçu'}
        </span>
    );
}

const emptyForm = () => ({
    nom: '', color: 'text-slate-500',
    bg_color: 'bg-slate-50 dark:bg-slate-800/40', icon_name: 'more-horizontal',
    is_default: false,
});

export default function CategoriesIndex() {
    const { categories } = usePage().props as { categories: Category[] };
    const { props } = usePage<{ errors?: Record<string, string> }>();

    const [modal,      setModal]      = useState<'create' | 'edit' | null>(null);
    const [editing,    setEditing]    = useState<Category | null>(null);
    const [form,       setForm]       = useState(emptyForm());
    const [processing, setProcessing] = useState(false);
    const { confirmState, confirm, closeConfirm } = useConfirmDialog();

    function openCreate() { setForm(emptyForm()); setEditing(null); setModal('create'); }

    function openEdit(c: Category) {
        setForm({ nom: c.nom, color: c.color, bg_color: c.bg_color, icon_name: c.icon_name, is_default: c.is_default });
        setEditing(c);
        setModal('edit');
    }

    function closeModal() { setModal(null); setEditing(null); }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        if (modal === 'create') {
            router.post('/parametres/categories', form, {
                onSuccess: () => closeModal(), onFinish: () => setProcessing(false),
            });
        } else if (editing) {
            router.put(`/parametres/categories/${editing.uuid}`, form, {
                onSuccess: () => closeModal(), onFinish: () => setProcessing(false),
            });
        }
    }

    function handleDelete(c: Category) {
        confirm({
            title: 'Supprimer cette catégorie ?',
            description: `« ${c.nom} » sera supprimée. Les charges existantes avec cette catégorie garderont leur catégorie actuelle.`,
            onConfirm: () => { router.delete(`/parametres/categories/${c.uuid}`, { onFinish: closeConfirm }); },
        });
    }

    const selectedColor = COLOR_OPTIONS.find(o => o.color === form.color) ?? COLOR_OPTIONS[COLOR_OPTIONS.length - 1];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Catégories de charges" />
            <ConfirmDialog open={confirmState.open} onOpenChange={closeConfirm}
                title={confirmState.title} description={confirmState.description}
                onConfirm={confirmState.onConfirm} />

            {/* Modal */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={closeModal}>
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-foreground">{modal === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}</h2>
                            <button onClick={closeModal} className="rounded-lg p-1.5 hover:bg-accent">
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>
                        {props.errors && Object.keys(props.errors).length > 0 && (
                            <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-3 py-2.5 text-xs text-red-700 dark:text-red-400">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span>{Object.values(props.errors)[0]}</span>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Nom */}
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Nom *</label>
                                <Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                                    placeholder="Ex. Maintenance" className="rounded-xl h-9" required />
                            </div>

                            {/* Icon */}
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Icône</label>
                                <Select value={form.icon_name} onValueChange={v => setForm(f => ({ ...f, icon_name: v }))}>
                                    <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ICON_OPTIONS.map(o => (
                                            <SelectItem key={o.value} value={o.value}>
                                                <span className="flex items-center gap-2">
                                                    <o.Icon className="w-3.5 h-3.5" /> {o.label}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Color */}
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Couleur</label>
                                <div className="grid grid-cols-6 gap-2">
                                    {COLOR_OPTIONS.map(o => (
                                        <button key={o.color} type="button"
                                            onClick={() => setForm(f => ({ ...f, color: o.color, bg_color: o.bg }))}
                                            className={`h-8 rounded-lg flex items-center justify-center transition-all ${o.bg} ${
                                                form.color === o.color ? 'ring-2 ring-offset-1 ring-blue-500' : 'hover:scale-105'
                                            }`}>
                                            <span className={`text-[10px] font-bold ${o.color}`}>{o.label[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* is_default toggle */}
                            <label className="flex items-center gap-3 cursor-pointer select-none rounded-xl border border-border px-4 py-3 hover:bg-accent/40 transition-colors">
                                <input type="checkbox" className="sr-only" checked={form.is_default}
                                    onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} />
                                <div className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${form.is_default ? 'bg-blue-600' : 'bg-muted-foreground/30'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_default ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Catégorie par défaut</p>
                                    <p className="text-xs text-muted-foreground">Protégée contre la suppression</p>
                                </div>
                            </label>

                            {/* Preview */}
                            <div className="rounded-xl bg-muted/40 px-4 py-3 flex items-center gap-3">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aperçu</span>
                                <CatPreview nom={form.nom} color={form.color} bg_color={form.bg_color} icon_name={form.icon_name} />
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                                <Button type="button" variant="outline" className="rounded-xl" onClick={closeModal}>Annuler</Button>
                                <Button type="submit" disabled={processing} className="rounded-xl bg-blue-600 hover:bg-blue-700">
                                    {processing ? 'Enregistrement…' : modal === 'create' ? 'Créer' : 'Enregistrer'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl"
                            onClick={() => router.visit('/charges')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60">
                                <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Catégories de charges</h1>
                                <p className="text-sm text-muted-foreground">Gérez les catégories utilisées dans les charges</p>
                            </div>
                        </div>
                    </div>
                    <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Nouvelle catégorie
                    </Button>
                </div>

                {/* List */}
                <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                            <tr>
                                <th className="px-5 py-3 text-left">Catégorie</th>
                                <th className="px-5 py-3 text-left">Slug</th>
                                <th className="px-5 py-3 text-left">Aperçu badge</th>
                                <th className="px-5 py-3 text-center">Type</th>
                                <th className="px-5 py-3 w-20" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {categories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                                        <Settings className="w-8 h-8 mx-auto opacity-20 mb-2" />
                                        <p>Aucune catégorie. <button onClick={openCreate} className="text-blue-500 hover:underline">Créer la première</button></p>
                                    </td>
                                </tr>
                            ) : categories.map(c => (
                                <tr key={c.uuid} className="hover:bg-accent/30 transition-colors">
                                    <td className="px-5 py-3 font-medium text-foreground">{c.nom}</td>
                                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                                    <td className="px-5 py-3">
                                        <CatPreview nom={c.nom} color={c.color} bg_color={c.bg_color} icon_name={c.icon_name} />
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        {c.is_default ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                                                <Lock className="w-3 h-3" /> Défaut
                                            </span>
                                        ) : (
                                            <span className="text-xs text-emerald-600 font-semibold">Personnalisé</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-1 justify-end">
                                            <button onClick={() => openEdit(c)}
                                                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            {!c.is_default && (
                                                <button onClick={() => handleDelete(c)}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-muted-foreground hover:text-red-600 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Info */}
                <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 px-5 py-4 text-sm text-blue-700 dark:text-blue-400">
                    <p className="font-semibold mb-1">Comment ça marche ?</p>
                    <p className="text-xs leading-relaxed">Les catégories avec le cadenas <Lock className="inline w-3 h-3 mx-0.5" /> sont des catégories système par défaut : vous pouvez les modifier mais pas les supprimer. Les catégories personnalisées peuvent être supprimées (les charges existantes gardent leur catégorie actuelle).</p>
                </div>
            </div>
        </AppLayout>
    );
}
