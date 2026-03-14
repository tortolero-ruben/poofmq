import { Head, Link, usePage } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { QuickstartContent } from '@/components/quickstart-content';
import { dashboard, home, login } from '@/routes';
import { quickstart as docsQuickstart } from '@/routes/docs';
import { index as startIndex } from '@/routes/start';

export default function Quickstart() {
    const { auth } = usePage().props as {
        auth: {
            user: { id: number } | null;
        };
    };

    return (
        <div className="min-h-screen bg-background">
            <Head title="Quickstart" />
            <header className="border-b border-border bg-background/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <Link href={home()} className="flex items-center">
                        <AppLogo />
                    </Link>

                    <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
                        <Link
                            href={startIndex()}
                            className="hover:text-foreground"
                        >
                            Start instantly
                        </Link>
                        <a
                            href="https://github.com/rubybear-lgtm/poofmq"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-foreground"
                        >
                            Repository
                        </a>
                    </nav>

                    <div className="flex items-center gap-3">
                        {auth.user === null ? (
                            <Link
                                href={login()}
                                className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                            >
                                Sign in
                            </Link>
                        ) : (
                            <Link
                                href={dashboard()}
                                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:gap-8 sm:p-6">
                <div className="pt-2 sm:pt-4">
                    <h1
                        className="text-2xl font-semibold tracking-tight sm:text-3xl"
                        id="quickstart-heading"
                    >
                        Quickstart
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
                        Send and receive your first PoofMQ message. Covers queue
                        setup, HTTP requests, and SDK examples for Node and
                        Python.
                    </p>
                </div>
                <QuickstartContent
                    quickstartHref={docsQuickstart.url()}
                    startHref={startIndex.url()}
                    showQuickstartLink={false}
                />
            </main>
        </div>
    );
}
