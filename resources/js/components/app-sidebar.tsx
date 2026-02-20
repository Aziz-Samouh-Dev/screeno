import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Box, Database, Users, Truck, FileUp, FileDown, CreditCard, RotateCcw, ChartLine } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { dashboard } from '@/routes';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Products',
        href: '/products',
        icon: Box ,
    },
    {
        title: 'Stock',
        href: './',
        icon: Database ,
    },
    {
        title: 'Clients',
        href: './',
        icon: Users ,
    },
    {
        title: 'Suppliers',
        href: './',
        icon: Truck ,
    },
    {
        title: 'Sales Invoices',
        href: './',
        icon: FileUp ,
    },
    {
        title: 'Pruchase Invoices',
        href: './',
        icon: FileDown ,
    },
    {
        title: 'Payments',
        href: './',
        icon: CreditCard ,
    },
    {
        title: 'Returns',
        href: './',
        icon: RotateCcw ,
    },

];

const footerNavItems: NavItem[] = [
    {
        title: 'Reports',
        href: './',
        icon: ChartLine ,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
