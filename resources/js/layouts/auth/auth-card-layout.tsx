import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';
import { ArrowLeft } from 'lucide-react';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
              <Link
                href={home()}
                className="absolute top-8 left-8 flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
            </Link>
            <div className="flex w-full max-w-md flex-col gap-6">

                <div className="flex flex-col gap-6">
                    <Card className="rounded-xl">
                        <CardHeader className="px-10 pt-8 pb-0 text-center">
                            <Link
                                href={home()}
                                className="flex items-center gap-2 self-center font-medium"
                            >
                                <div className="flex h-9 w-9 items-center justify-center">
                                    <AppLogoIcon className="size-9 fill-current text-black dark:text-white" />
                                </div>
                            </Link>
                            <CardTitle className="text-xl pt-6">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">
                            {children}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
