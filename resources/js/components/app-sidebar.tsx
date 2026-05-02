import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, Package, Users, Truck,
    CreditCard, Warehouse, Building2, Settings,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar, SidebarContent, SidebarFooter,
    SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogoIcon from './app-logo-icon';
import { dashboard } from '@/routes';

const generalItems: NavItem[] = [
    { title: 'Tableau de bord', href: dashboard(),  icon: LayoutDashboard, iconColor: 'text-sidebar-foreground/80' },
    { title: 'Produits',        href: '/produits',  icon: Package,         iconColor: 'text-sidebar-foreground/80' },
    { title: 'Clients',         href: '/clients',   icon: Users,           iconColor: 'text-sidebar-foreground/80' },
    { title: 'Fournisseurs',    href: '/suppliers', icon: Truck,           iconColor: 'text-sidebar-foreground/80' },
];

const financeItems: NavItem[] = [
    { title: 'Paiements',       href: '/payments',  icon: CreditCard,      iconColor: 'text-sidebar-foreground/80' },
    { title: 'Stock endommagé', href: '/stock',     icon: Warehouse,       iconColor: 'text-sidebar-foreground/80' },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const isAdmin = (auth as any)?.user?.role === 'admin';

    const settingsItems: NavItem[] = [
        ...(isAdmin ? [{ title: "Profil d'entreprise", href: '/settings/company', icon: Building2 }] : []),
        { title: 'Paramètres', href: '/settings/profile', icon: Settings },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <div className="flex h-8 w-8 items-center justify-center">
                                    <AppLogoIcon className="size-7 text-sidebar-foreground" />
                                </div>
                                <span className="font-black font-mono uppercase tracking-wider text-sidebar-foreground text-base">
                                    Screeno
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-0">
                <NavMain items={generalItems} label="Général" />
                <div className="mx-3 my-1 h-px bg-sidebar-border/40" />
                <NavMain items={financeItems} label="Finances" />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={settingsItems} label="Administration" className="mt-auto" />
                <div className="mx-3 my-1 h-px bg-sidebar-border/40" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
