import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { Toaster } from '@/components/ui/sonner';
import { useFlashToast } from '@/hooks/use-flash-toast';
import type { AppLayoutProps } from '@/types';

function FlashWatcher() {
    useFlashToast();
    return null;
}

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <FlashWatcher />
                {children}
            </AppContent>
            <Toaster />
        </AppShell>
    );
}
