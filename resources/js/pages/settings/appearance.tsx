import { Head, usePage } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type SidebarTheme, useSidebarTheme } from '@/hooks/use-sidebar-theme';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Paramètres', href: '/settings/profile' },
    { title: 'Apparence', href: '/settings/appearance' },
];

const SIDEBAR_THEMES: { value: SidebarTheme; label: string; bg: string }[] = [
    { value: 'default', label: 'Clair',  bg: 'bg-slate-100'  },
    { value: 'dark',    label: 'Sombre', bg: 'bg-slate-900'  },
    { value: 'blue',    label: 'Bleu',   bg: 'bg-blue-950'   },
    { value: 'violet',  label: 'Violet', bg: 'bg-violet-950' },
];

export default function Appearance() {
    const { auth } = usePage().props as any;
    const isAdmin = auth?.user?.role === 'admin';
    const { theme, setTheme } = useSidebarTheme();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Apparence" />
            <SettingsLayout>
                <div className="space-y-8">

                    {/* Dark / light mode */}
                    <div className="space-y-3">
                        <div>
                            <h2 className="text-base font-semibold">Mode d'affichage</h2>
                            <p className="text-sm text-muted-foreground">Choisissez entre le mode clair, sombre ou système.</p>
                        </div>
                        <AppearanceTabs />
                    </div>

                    {/* Sidebar colour — admin only */}
                    {isAdmin && (
                        <div className="space-y-3">
                            <div>
                                <h2 className="text-base font-semibold">Couleur de la barre latérale</h2>
                                <p className="text-sm text-muted-foreground">Personnalisez la couleur de la sidebar pour toute la plateforme.</p>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {SIDEBAR_THEMES.map((t) => (
                                    <button
                                        key={t.value}
                                        onClick={() => setTheme(t.value)}
                                        className={cn(
                                            'flex flex-col items-center gap-2 rounded-xl border-2 p-1.5 transition-all',
                                            theme === t.value
                                                ? 'border-primary ring-2 ring-primary/20'
                                                : 'border-transparent hover:border-muted-foreground/20',
                                        )}
                                    >
                                        {/* Mini sidebar preview */}
                                        <div className="flex h-16 w-full overflow-hidden rounded-lg border border-border shadow-sm">
                                            <div className={cn('w-6 h-full flex flex-col gap-1.5 items-center pt-3', t.bg)}>
                                                <div className="w-3 h-0.5 rounded-full bg-white/50" />
                                                <div className="w-3 h-0.5 rounded-full bg-white/50" />
                                                <div className="w-3 h-0.5 rounded-full bg-white/50" />
                                                <div className="w-3 h-0.5 rounded-full bg-white/50" />
                                            </div>
                                            <div className="flex-1 bg-background p-1.5 space-y-1.5">
                                                <div className="h-1.5 rounded bg-muted w-full" />
                                                <div className="h-1.5 rounded bg-muted w-4/5" />
                                                <div className="h-1.5 rounded bg-muted w-3/5" />
                                                <div className="h-1.5 rounded bg-muted w-4/5" />
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold text-muted-foreground">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
