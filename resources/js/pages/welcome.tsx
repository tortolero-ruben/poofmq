import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import DeveloperKeyDialog from '@/components/developer-key-dialog';
import InstantStartDialog from '@/components/instant-start-dialog';
import LiveDemoPanel from '@/components/live-demo-panel';
import { dashboard, login } from '@/routes';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;
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

            <div className="relative flex min-h-screen flex-col bg-background font-sans text-foreground">
                {/* Header */}
                <header className="sticky top-0 z-50 flex flex-col items-start justify-between gap-6 border-b border-border bg-background/80 px-6 py-5 backdrop-blur-md md:flex-row md:items-center lg:px-12">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-primary">
                            cyclone
                        </span>
                        <h2 className="text-2xl font-bold tracking-tight">
                            PoofMQ
                        </h2>
                    </div>
                    <nav className="flex flex-wrap gap-x-8 gap-y-2 text-base font-medium">
                        <a
                            className="text-muted-foreground transition-colors hover:text-primary"
                            href="#features"
                        >
                            Features
                        </a>
                        <a
                            className="text-muted-foreground transition-colors hover:text-primary"
                            href="#pricing"
                        >
                            Pricing
                        </a>
                        <a
                            className="text-muted-foreground transition-colors hover:text-primary"
                            href="/docs/quickstart"
                        >
                            Docs
                        </a>
                        <a
                            className="text-muted-foreground transition-colors hover:text-primary"
                            href="#vault"
                        >
                            Vault
                        </a>
                    </nav>
                    <div className="flex gap-3">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="inline-flex items-center justify-center rounded-lg border border-border bg-transparent px-5 py-2.5 text-sm font-medium transition-all hover:bg-muted"
                                >
                                    Sign in
                                </Link>
                                {canRegister && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsDeveloperKeyDialogOpen(true)
                                        }
                                        className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                                    >
                                        Get free dev key
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </header>

                <main className="flex-1">
                    {/* Hero Section */}
                    <section className="border-b border-border bg-background px-6 py-16 lg:px-12 lg:py-24">
                        <div className="mx-auto max-w-7xl">
                            <div className="mb-8">
                                <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    System status: v1.4 stable
                                </div>
                                <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
                                    Simple,
                                    <br />
                                    <span className="text-primary">Free</span>
                                    <br />
                                    Message Queue
                                </h1>
                            </div>

                            <p className="mb-12 max-w-2xl text-lg text-muted-foreground">
                                Start instantly with a free queue, or get a free
                                dev key for reusable SDK access. Same simple
                                message queue. Two ways to start.
                            </p>

                            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                                <LiveDemoPanel />

                                <div className="grid gap-6">
                                    <div className="rounded-2xl border border-border bg-card p-8">
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
                                        <div className="mb-6 overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-sm">
                                            <p className="text-muted-foreground">
                                                # Push message
                                            </p>
                                            <p>
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
                                            className="inline-flex items-center justify-center rounded-lg bg-foreground px-6 py-3 text-base font-semibold text-background transition-all hover:bg-foreground/90"
                                        >
                                            Start instantly
                                        </button>
                                    </div>

                                    <div className="rounded-2xl border-2 border-primary bg-card p-8 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
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
                                        <div className="mb-6 overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-sm">
                                            <p className="text-muted-foreground">
                                                # Node SDK
                                            </p>
                                            <p>npm install poofmq</p>
                                            <p className="mt-2 text-muted-foreground">
                                                # Use your key
                                            </p>
                                            <p>
                                                new PoofmqClient({`{ apiKey }`})
                                            </p>
                                        </div>
                                        {auth.user ? (
                                            <Link
                                                href={dashboard()}
                                                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90"
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
                                                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                                            >
                                                Get free dev key
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section
                        id="features"
                        className="grid bg-muted/30 md:grid-cols-2"
                    >
                        <div className="group border-b border-border p-8 transition-colors hover:bg-muted/50 md:border-r">
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
                        <div className="group border-b border-border p-8 transition-colors hover:bg-muted/50">
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
                        <div className="group border-b border-border p-8 transition-colors hover:bg-muted/50 md:border-r md:border-b-0">
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
                                community via the Runway Vault to keep the
                                servers spinning for all.
                            </p>
                        </div>
                        <div className="group p-8 transition-colors hover:bg-muted/50">
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

                    {/* Runway Vault Section */}
                    <section
                        id="vault"
                        className="border-b border-border bg-muted/30 px-6 py-24"
                    >
                        <div className="mx-auto max-w-4xl">
                            <div className="mb-12 flex flex-col items-start gap-4">
                                <div className="inline-flex items-center rounded-lg bg-foreground px-3 py-1.5 text-sm font-semibold text-background">
                                    Runway Vault Status
                                </div>
                                <p className="max-w-2xl text-lg text-muted-foreground">
                                    The Runway Vault covers our monthly
                                    infrastructure costs to keep PoofMQ free for
                                    everyone.
                                </p>
                            </div>
                            <div className="rounded-3xl border border-border bg-card p-10">
                                <div className="mb-8 flex items-end justify-between">
                                    <div>
                                        <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Current revenue stream
                                        </p>
                                        <p className="text-4xl font-bold text-primary">
                                            $420 / $500
                                        </p>
                                    </div>
                                    <p className="text-6xl font-bold text-muted-foreground/30">
                                        84%
                                    </p>
                                </div>
                                <div className="mb-10 h-6 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80"
                                        style={{ width: '84%' }}
                                    ></div>
                                </div>
                                <div className="mb-10 rounded-xl bg-muted/50 p-5">
                                    <p className="text-sm text-muted-foreground">
                                        Current Railway API billing and Redis
                                        cluster overhead covered by community
                                        tips.
                                    </p>
                                </div>
                                <button className="w-full rounded-xl border border-primary py-4 font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                                    Drop a tip in the vault
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Pricing Section */}
                    <section
                        id="pricing"
                        className="mx-auto max-w-6xl px-6 py-24"
                    >
                        <h2 className="mb-4 text-center text-4xl font-bold tracking-tight md:text-5xl">
                            Pricing
                        </h2>
                        <p className="mb-16 text-center text-lg text-muted-foreground">
                            All tiers are subsidized by the community tip jar.
                            Zero VC funding.
                        </p>

                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Instant Tier */}
                            <div className="flex flex-col rounded-3xl border border-border bg-card p-8">
                                <h3 className="mb-2 text-xl font-bold tracking-tight">
                                    Instant
                                </h3>
                                <div className="mb-8">
                                    <span className="text-4xl font-bold">
                                        $0
                                    </span>
                                    <span className="ml-1 text-muted-foreground">
                                        /free
                                    </span>
                                </div>
                                <ul className="mb-10 flex-1 space-y-4">
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">
                                            check
                                        </span>
                                        <span className="text-muted-foreground">
                                            Free queue access
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">
                                            check
                                        </span>
                                        <span className="text-muted-foreground">
                                            10,000 req/month
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">
                                            check
                                        </span>
                                        <span className="text-muted-foreground">
                                            10min message TTL
                                        </span>
                                    </li>
                                </ul>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsInstantStartDialogOpen(true)
                                    }
                                    className="w-full rounded-lg border border-border py-3 text-sm font-semibold transition-all hover:bg-muted"
                                >
                                    Start instantly
                                </button>
                            </div>

                            {/* Developer Key Tier */}
                            <div className="relative flex flex-col rounded-3xl border-2 border-primary bg-card p-8 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                                <div className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                                    Fully subsidized
                                </div>
                                <h3 className="mb-2 text-xl font-bold tracking-tight">
                                    Dev Key
                                </h3>
                                <div className="mb-8">
                                    <span className="text-4xl font-bold">
                                        $0
                                    </span>
                                    <span className="ml-1 text-muted-foreground">
                                        /free
                                    </span>
                                </div>
                                <ul className="mb-10 flex-1 space-y-4">
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">
                                            check
                                        </span>
                                        <span className="text-muted-foreground">
                                            Project management
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">
                                            check
                                        </span>
                                        <span className="text-muted-foreground">
                                            Scoped API keys
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">
                                            check
                                        </span>
                                        <span className="text-muted-foreground">
                                            Zero-knowledge encryption
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">
                                            check
                                        </span>
                                        <span className="text-muted-foreground">
                                            1,000,000 req
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">
                                            check
                                        </span>
                                        <span className="text-muted-foreground">
                                            24h TTL
                                        </span>
                                    </li>
                                </ul>
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="w-full rounded-lg bg-primary py-3 text-center text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
                                    >
                                        Go to dashboard
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsDeveloperKeyDialogOpen(true)
                                        }
                                        className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                                    >
                                        Get free dev key
                                    </button>
                                )}
                            </div>

                            {/* Tip Jar Tier */}
                            <div className="flex flex-col rounded-3xl border border-border bg-card p-8">
                                <h3 className="mb-2 text-xl font-bold tracking-tight">
                                    Tip Jar
                                </h3>
                                <div className="mb-2">
                                    <span className="text-4xl font-bold">
                                        Custom
                                    </span>
                                </div>
                                <p className="mb-8 text-sm text-muted-foreground italic">
                                    "Help keep the lights on for the community."
                                </p>
                                <ul className="mb-10 flex-1 space-y-4">
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">
                                            volunteer_activism
                                        </span>
                                        <span className="text-muted-foreground">
                                            Support OSS devs
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">
                                            star
                                        </span>
                                        <span className="text-muted-foreground">
                                            Donor badge
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">
                                            priority_high
                                        </span>
                                        <span className="text-muted-foreground">
                                            Priority support
                                        </span>
                                    </li>
                                </ul>
                                <button className="w-full rounded-lg border border-border py-3 text-sm font-semibold transition-all hover:bg-muted">
                                    Contribute
                                </button>
                            </div>
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

                {/* Footer */}
                <footer className="border-t border-border bg-card px-6 py-8 lg:px-12">
                    <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-3xl text-primary">
                                cyclone
                            </span>
                            <span className="text-lg font-semibold">
                                PoofMQ v1.4
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            2024 PoofMQ. Built with Golang & pride. Zero
                            tracking.
                        </p>
                        <div className="flex gap-6">
                            <a
                                className="text-muted-foreground transition-colors hover:text-primary"
                                href="https://github.com/poofmq"
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
