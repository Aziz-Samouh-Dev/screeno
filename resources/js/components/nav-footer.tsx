import type { ComponentPropsWithoutRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

export function NavFooter({
    items,
    label,
    className,
    ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
    label?: string;
}) {
    const { url } = usePage();

    return (
        <SidebarGroup
            {...props}
            className={`group-data-[collapsible=icon]:p-0 px-2 py-0 ${className || ''}`}
        >
            {label && (
                <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-widest font-semibold px-2">
                    {label}
                </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => {
                        const isActive = url.startsWith(item.href);
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    tooltip={{ children: item.title }}
                                    className={[
                                        'relative h-9 rounded-xl gap-3 px-2.5 text-sm font-medium transition-all duration-150',
                                        isActive
                                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                                    ].join(' ')}
                                >
                                    <Link href={item.href}>
                                        {item.icon && (
                                            <item.icon strokeWidth={1.5} className={`size-4.5! shrink-0 ${isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50'}`} />
                                        )}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
