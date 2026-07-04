import { useState, useRef, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useAppearance, type Appearance } from '@/hooks/use-appearance';
import { type SidebarTheme, useSidebarTheme } from '@/hooks/use-sidebar-theme';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

const SIDEBAR_THEMES: { value: SidebarTheme; label: string; bg: string }[] = [
    { value: 'default', label: 'Clair',  bg: 'bg-slate-100'  },
    { value: 'dark',    label: 'Sombre', bg: 'bg-slate-900'  },
    { value: 'blue',    label: 'Bleu',   bg: 'bg-blue-950'   },
    { value: 'violet',  label: 'Violet', bg: 'bg-violet-950' },
];

const APPEARANCE_TABS: { value: Appearance; icon: typeof Sun; label: string }[] = [
    { value: 'light',  icon: Sun,     label: 'Clair'   },
    { value: 'dark',   icon: Moon,    label: 'Sombre'  },
    { value: 'system', icon: Monitor, label: 'Système' },
];

function ThemePopover() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { appearance, resolvedAppearance, updateAppearance } = useAppearance();
    const { theme, setTheme } = useSidebarTheme();
    const { auth } = usePage().props;
    const isAdmin = (auth as any)?.user?.role === 'admin';
    const isDark = resolvedAppearance === 'dark';

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(v => !v)}
                title="Apparence"
                className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
                    'hover:bg-accent text-muted-foreground hover:text-foreground',
                    open && 'bg-accent text-foreground',
                )}
            >
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-border bg-card shadow-xl p-4 space-y-4">

                    {/* Mode d'affichage */}
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mode d'affichage</p>
                        <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
                            {APPEARANCE_TABS.map(({ value, icon: Icon, label }) => (
                                <button
                                    key={value}
                                    onClick={() => updateAppearance(value)}
                                    className={cn(
                                        'flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                                        appearance === value
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Couleur de la barre latérale — admin only */}
                    {isAdmin && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Couleur de la barre latérale</p>
                            <div className="grid grid-cols-4 gap-2">
                                {SIDEBAR_THEMES.map(t => (
                                    <button
                                        key={t.value}
                                        onClick={() => setTheme(t.value)}
                                        className={cn(
                                            'flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition-all',
                                            theme === t.value
                                                ? 'shadow-lg shadow-black/20 scale-105'
                                                : 'opacity-60 hover:opacity-90',
                                        )}
                                    >
                                        <div className="flex h-10 w-full overflow-hidden rounded-lg border border-border shadow-sm">
                                            <div className={cn('w-5 h-full flex flex-col gap-1 items-center pt-2', t.bg)}>
                                                <div className="w-2.5 h-0.5 rounded-full bg-white/50" />
                                                <div className="w-2.5 h-0.5 rounded-full bg-white/50" />
                                                <div className="w-2.5 h-0.5 rounded-full bg-white/50" />
                                            </div>
                                            <div className="flex-1 bg-background p-1 space-y-1">
                                                <div className="h-1 rounded bg-muted w-full" />
                                                <div className="h-1 rounded bg-muted w-3/4" />
                                                <div className="h-1 rounded bg-muted w-4/5" />
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-semibold text-muted-foreground">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-1">
                <ThemePopover />
            </div>
        </header>
    );
}
