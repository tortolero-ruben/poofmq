import { Link } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import type { AuthLayoutProps } from '@/types';
import { home } from '@/routes';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center bg-background px-6 py-10 md:px-10">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,oklch(0.96_0.02_75),transparent_35%),linear-gradient(to_bottom,transparent,oklch(0.99_0_0))] dark:bg-[radial-gradient(circle_at_top,oklch(0.2_0.02_75),transparent_30%),linear-gradient(to_bottom,transparent,oklch(0.1_0_0))]" />
            <div className="w-full max-w-md">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <AppLogo size="lg" />
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                                {title}
                            </h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
