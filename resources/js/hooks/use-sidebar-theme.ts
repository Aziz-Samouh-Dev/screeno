import { useEffect, useState } from 'react';

export type SidebarTheme = 'default' | 'dark' | 'blue' | 'violet';

const KEY = 'screeno_sidebar_theme';

export function useSidebarTheme() {
    const [theme, setThemeState] = useState<SidebarTheme>(() => {
        if (typeof window === 'undefined') return 'default';
        return (localStorage.getItem(KEY) as SidebarTheme) ?? 'default';
    });

    useEffect(() => {
        const el = document.documentElement;
        if (theme === 'default') {
            el.removeAttribute('data-sidebar-theme');
        } else {
            el.setAttribute('data-sidebar-theme', theme);
        }
        localStorage.setItem(KEY, theme);
    }, [theme]);

    function setTheme(t: SidebarTheme) {
        setThemeState(t);
    }

    return { theme, setTheme };
}
