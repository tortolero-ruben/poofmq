import { Link } from '@inertiajs/react';
import type { AuthLayoutProps } from '@/types';
import { home } from '@/routes';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-black p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-4xl text-[#FFBF00]">
                                    cyclone
                                </span>
                                <span className="text-2xl font-black italic">
                                    POOF_MQ
                                </span>
                            </div>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-bold tracking-wide uppercase">
                                {title}
                            </h1>
                            <p className="text-center text-sm text-white/60">
                                {description}
                            </p>
                        </div>
                    </div>
                    <div className="border-4 border-white bg-[#0a0a0a] p-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
