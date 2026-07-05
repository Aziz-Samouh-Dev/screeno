import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, Package, Users, Truck,
    Wallet, Building2, Settings,
    TrendingUp, Receipt, User, ShieldAlert,
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
    { title: 'Tableau de bord', href: dashboard(),  icon: LayoutDashboard },
    { title: 'Clients',         href: '/clients',   icon: Users            },
    { title: 'Fournisseurs',    href: '/suppliers', icon: Truck            },
    { title: 'Produits',        href: '/produits',  icon: Package          },
];

const operationsItems: NavItem[] = [
    { title: 'Paiements',       href: '/payments',  icon: Wallet           },
    { title: 'Stock endommagé', href: '/stock',     icon: ShieldAlert      },
];

const gestionItems: NavItem[] = [
    { title: 'Finances',  href: '/finances',  icon: TrendingUp },
    { title: 'Charges',   href: '/charges',   icon: Receipt    },
    { title: 'Employés',  href: '/employees', icon: User       },
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
                <NavMain items={operationsItems} label="Opérations" />
                {isAdmin && (
                    <>
                        <div className="mx-3 my-1 h-px bg-sidebar-border/40" />
                        <NavMain items={gestionItems} label="Gestion" />
                    </>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={settingsItems} label="Administration" className="mt-auto" />
                <div className="mx-3 my-1 h-px bg-sidebar-border/40" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
