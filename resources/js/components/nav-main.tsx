import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [], label }: { items: NavItem[]; label?: string }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-1">
            {label && (
                <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[9px] tracking-[0.12em] font-bold px-2 mb-0.5 group-data-[collapsible=icon]:hidden">
                    {label}
                </SidebarGroupLabel>
            )}
            <SidebarMenu className="gap-0.5">
                {items.map((item) => {
                    const active = isCurrentUrl(item.href);
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className={[
                                    'relative h-9 rounded-xl gap-3 px-2.5 text-sm font-medium transition-all duration-150',
                                    active
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                        : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                                ].join(' ')}
                            >
                                <Link href={item.href} prefetch>
                                    {/* Active left indicator bar */}
                                    {active && (
                                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-sidebar-primary group-data-[collapsible=icon]:hidden" />
                                    )}
                                    {item.icon && (
                                        <item.icon
                                            strokeWidth={1.5}
                                            className={[
                                                'size-4.5! shrink-0 transition-colors',
                                                active ? 'text-sidebar-primary' : 'text-sidebar-foreground/50',
                                            ].join(' ')}
                                        />
                                    )}
                                    <span className="truncate">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
