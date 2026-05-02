import { cn } from '@/lib/utils';
import type { SVGAttributes } from 'react';

export default function AppLogoIcon({ className, ...props }: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn('lucide lucide-asterisk', className)}
        >
            <path d="M12 6v12"/>
            <path d="M17.196 9 6.804 15"/>
            <path d="m6.804 9 10.392 6"/>
        </svg>
    );
}
