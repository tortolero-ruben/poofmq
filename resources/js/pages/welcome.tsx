import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import DeveloperKeyDialog from '@/components/developer-key-dialog';
import InstantStartDialog from '@/components/instant-start-dialog';
import KoFiButton from '@/components/ko-fi-button';
import LiveDemoPanel from '@/components/live-demo-panel';
import { dashboard, home, login } from '@/routes';

const useCases = [
    {
        icon: 'auto_awesome',
        title: 'Background processing',
        summary:
            'Move time-consuming work off the request path so your app can respond quickly while workers process jobs in the background.',
    },
    {
        icon: 'hub',
        title: 'Event buffering',
        summary:
            'Accept incoming events once, push them into PoofMQ, and let downstream services process them without blocking delivery.',
    },
    {
        icon: 'routine',
        title: 'Scheduled workflows',
        summary:
            'Run recurring jobs and internal workflows through a shared queue instead of relying on fragile one-off task wiring.',
    },
] as const;

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth, version, donationUrl } = usePage().props;
    const [isInstantStartDialogOpen, setIsInstantStartDialogOpen] =
        useState(false);
    const [isDeveloperKeyDialogOpen, setIsDeveloperKeyDialogOpen] =
        useState(false);

    return (
        <>
            <Head title="PoofMQ — Dumb Simple Message Queue">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex min-h-screen flex-col overflow-x-clip bg-background font-sans text-foreground">
                <header className="sticky top-0 z-50 flex flex-col items-start justify-between gap-4 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md sm:px-6 md:flex-row md:items-center lg:px-12">
                    <Link
                        href={home()}
                        className="rounded focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
                    >
                        <AppLogo size="lg" />
                    </Link>
                    <nav className="flex w-full flex-wrap gap-x-5 gap-y-2 text-sm font-medium sm:text-base md:w-auto">
                        <a
                            className="text-muted-foreground transition-colors hover:text-primary"
                            href="#features"
                        >
                            Features
                        </a>
                        <a
                            className="text-muted-foreground transition-colors hover:text-primary"
                            href="#use-cases"
                        >
                            Use Cases
                        </a>
                        <a
                            className="text-muted-foreground transition-colors hover:text-primary"
                            href="/docs/quickstart"
                        >
                            Docs
                        </a>
                    </nav>
                    <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] sm:w-auto"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-transparent px-5 py-2.5 text-sm font-medium transition-all hover:bg-muted sm:w-auto"
                                >
                                    Sign in
                                </Link>
                                {canRegister && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsDeveloperKeyDialogOpen(true)
                                        }
                                        className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] sm:w-auto"
                                    >
                                        Get free dev key
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </header>

                <main className="flex-1">
                    <section className="border-b border-border bg-background px-4 py-12 sm:px-6 sm:py-16 lg:px-12 lg:py-24">
                        <div className="mx-auto max-w-7xl min-w-0">
                            <div className="mb-6 sm:mb-8">
                                <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    System status: v{version} stable
                                </div>
                                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
                                    Simple,
                                    <br />
                                    <span className="text-primary">Free</span>
                                    <br />
                                    Message Queue
                                </h1>
                            </div>

                            <p className="mb-10 max-w-2xl text-base text-muted-foreground sm:mb-12 sm:text-lg">
                                Start instantly with a free queue, or get a free
                                dev key for reusable SDK access. Same simple
                                message queue. Two ways to start.
                            </p>

                            <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-8">
                                <LiveDemoPanel />

                                <div className="grid min-w-0 gap-6">
                                    <div className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-8">
                                        <div className="mb-4 inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                                            Fastest path
                                        </div>
                                        <h2 className="mb-3 text-2xl font-bold tracking-tight">
                                            Start instantly
                                        </h2>
                                        <p className="mb-6 text-muted-foreground">
                                            Create a free queue right now and
                                            start pushing and popping messages
                                            with almost no setup.
                                        </p>
                                        <div className="mb-6 max-w-full overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-xs sm:text-sm">
                                            <p className="text-muted-foreground">
                                                # Push message
                                            </p>
                                            <p className="min-w-max">
                                                curl -X POST
                                                https://poofmq.com/api/v1/q/
                                                <span className="text-primary">
                                                    {'{queue_id}'}
                                                </span>
                                                /messages
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIsInstantStartDialogOpen(
                                                    true,
                                                )
                                            }
                                            className="inline-flex w-full items-center justify-center rounded-lg bg-foreground px-6 py-3 text-base font-semibold text-background transition-all hover:bg-foreground/90 sm:w-auto"
                                        >
                                            Start instantly
                                        </button>
                                    </div>

                                    <div className="min-w-0 rounded-2xl border-2 border-primary bg-card p-5 shadow-[0_0_20px_rgba(245,158,11,0.15)] sm:p-8">
                                        <div className="mb-4 inline-flex items-center rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                                            Best for SDKs
                                        </div>
                                        <h2 className="mb-3 text-2xl font-bold tracking-tight">
                                            Get free dev key
                                        </h2>
                                        <p className="mb-6 text-muted-foreground">
                                            Verify once, copy your key, and
                                            start using the SDK with a reusable
                                            project-scoped credential.
                                        </p>
                                        <div className="mb-6 max-w-full overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-xs sm:text-sm">
                                            <p className="text-muted-foreground">
                                                # Node SDK
                                            </p>
                                            <p className="min-w-max">
                                                npm install poofmq
                                            </p>
                                            <p className="mt-2 text-muted-foreground">
                                                # Use your key
                                            </p>
                                            <p className="min-w-max">
                                                new PoofmqClient({`{ apiKey }`})
                                            </p>
                                        </div>
                                        {auth.user ? (
                                            <Link
                                                href={dashboard()}
                                                className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 sm:w-auto"
                                            >
                                                Go to dashboard
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsDeveloperKeyDialogOpen(
                                                        true,
                                                    )
                                                }
                                                className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] sm:w-auto"
                                            >
                                                Get free dev key
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {donationUrl && (
                                <div className="mt-8 rounded-3xl border border-[#72a4f2]/40 bg-linear-to-r from-[#72a4f2]/14 via-background to-background p-5 shadow-[0_18px_60px_rgba(114,164,242,0.14)] sm:mt-10 sm:p-6">
                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="max-w-2xl space-y-2">
                                            <p className="text-xs font-semibold tracking-[0.22em] text-[#72a4f2] uppercase">
                                                Community funded
                                            </p>
                                            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                                Keep PoofMQ free for the next
                                                developer.
                                            </h2>
                                            <p className="text-sm text-muted-foreground sm:text-base">
                                                PoofMQ stays online because the
                                                community helps cover hosting
                                                and queue infrastructure. If it
                                                saves you time, support it on
                                                Ko-fi.
                                            </p>
                                        </div>
                                        <KoFiButton
                                            href={donationUrl}
                                            size="lg"
                                            className="w-full sm:w-auto"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <section
                        id="features"
                        className="grid bg-muted/30 md:grid-cols-2"
                    >
                        <div className="group border-b border-border p-6 transition-colors hover:bg-muted/50 sm:p-8 md:border-r">
                            <span className="mb-6 block inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <span className="material-symbols-outlined text-2xl">
                                    bolt
                                </span>
                            </span>
                            <h3 className="mb-3 text-xl font-bold tracking-tight">
                                Start in seconds
                            </h3>
                            <p className="text-muted-foreground">
                                Create a free queue fast and start pushing
                                messages without a long setup flow.
                            </p>
                        </div>
                        <div className="group border-b border-border p-6 transition-colors hover:bg-muted/50 sm:p-8">
                            <span className="mb-6 block inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <span className="material-symbols-outlined text-2xl">
                                    lock
                                </span>
                            </span>
                            <h3 className="mb-3 text-xl font-bold tracking-tight">
                                Dev keys & projects
                            </h3>
                            <p className="text-muted-foreground">
                                Get a free dev key for reusable SDK access,
                                project isolation, and key management.
                            </p>
                        </div>
                        <div className="group border-b border-border p-6 transition-colors hover:bg-muted/50 sm:p-8 md:border-r md:border-b-0">
                            <span className="mb-6 block inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <span className="material-symbols-outlined text-2xl">
                                    favorite
                                </span>
                            </span>
                            <h3 className="mb-3 text-xl font-bold tracking-tight">
                                100% community funded
                            </h3>
                            <p className="text-muted-foreground">
                                No VC strings attached. Subsidized by the
                                community to keep the servers spinning for all.
                            </p>
                        </div>
                        <div className="group p-6 transition-colors hover:bg-muted/50 sm:p-8">
                            <span className="mb-6 block inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <span className="material-symbols-outlined text-2xl">
                                    code
                                </span>
                            </span>
                            <h3 className="mb-3 text-xl font-bold tracking-tight">
                                SDKs & APIs
                            </h3>
                            <p className="text-muted-foreground">
                                Official SDKs for Node.js, Python, and Go. Full
                                OpenAPI spec. Get started in under 5 minutes.
                            </p>
                        </div>
                    </section>

                    <section
                        id="use-cases"
                        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24"
                    >
                        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                            Use Cases
                        </h2>
                        <p className="mb-10 text-center text-base text-muted-foreground sm:mb-16 sm:text-lg">
                            Three simple ways teams can start building with
                            PoofMQ without redesigning their stack first.
                        </p>

                        <div className="grid min-w-0 gap-6 md:grid-cols-3">
                            {useCases.map((useCase) => (
                                <article
                                    key={useCase.title}
                                    className="flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-8"
                                >
                                    <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <span className="material-symbols-outlined text-2xl">
                                            {useCase.icon}
                                        </span>
                                    </span>
                                    <h3 className="mb-3 text-xl font-bold tracking-tight">
                                        {useCase.title}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {useCase.summary}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>
                </main>

                <InstantStartDialog
                    isOpen={isInstantStartDialogOpen}
                    onOpenChange={setIsInstantStartDialogOpen}
                />

                <DeveloperKeyDialog
                    isOpen={isDeveloperKeyDialogOpen}
                    onOpenChange={setIsDeveloperKeyDialogOpen}
                />

                <footer className="border-t border-border bg-card px-4 py-6 sm:px-6 sm:py-8 lg:px-12">
                    <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                        <div className="flex items-center gap-3">
                            <AppLogo size="md" />
                            <span className="text-lg font-semibold text-muted-foreground">
                                v{version}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © 2026 PoofMQ. Built with Golang & pride. Zero
                            tracking.
                        </p>
                        <div className="flex w-full gap-6 md:w-auto">
                            <a
                                className="text-muted-foreground transition-colors hover:text-primary"
                                href="https://github.com/rubybear-lgtm/poofmq"
                            >
                                <span className="material-symbols-outlined text-2xl">
                                    terminal
                                </span>
                            </a>
                            <a
                                className="text-muted-foreground transition-colors hover:text-primary"
                                href="#"
                            >
                                <span className="material-symbols-outlined text-2xl">
                                    rss_feed
                                </span>
                            </a>
                            <a
                                className="text-muted-foreground transition-colors hover:text-primary"
                                href="#"
                            >
                                <span className="material-symbols-outlined text-2xl">
                                    alternate_email
                                </span>
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
