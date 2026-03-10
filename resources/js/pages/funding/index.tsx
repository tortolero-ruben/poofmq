import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard, home, login } from '@/routes';

type FundingSummary = {
    gross_donations_cents: number;
    refunds_cents: number;
    net_funding_cents: number;
    event_count: number;
};

type BillingLatest = {
    workspace_current_spend_cents: number;
    workspace_estimated_spend_cents: number;
    poofmq_attributed_current_spend_cents: number;
    poofmq_attributed_estimated_spend_cents: number;
    funding_gap_cents: number;
    runway_months: number;
    coverage_percent: number;
    captured_at: string;
} | null;

type BillingSnapshot = {
    id: string;
    workspace_current_spend_cents: number;
    poofmq_attributed_estimated_spend_cents: number;
    funding_gap_cents: number;
    captured_at: string;
};

type Props = {
    funding: {
        summary: FundingSummary;
    };
    billing: {
        latest: BillingLatest;
        snapshots: BillingSnapshot[];
        is_stale: boolean;
        snapshot_age_minutes: number | null;
    };
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
});

function formatCents(cents: number): string {
    return currencyFormatter.format(cents / 100);
}

function formatAge(minutes: number | null): string {
    if (minutes === null) {
        return 'Unknown';
    }

    if (minutes < 60) {
        return `${minutes} minutes`;
    }

    return `${(minutes / 60).toFixed(1)} hours`;
}

export default function FundingPage({ funding, billing }: Props) {
    const latest = billing.latest;

    return (
        <>
            <Head title="Funding" />

            <div className="min-h-screen bg-[radial-gradient(circle_at_top,oklch(0.96_0.03_80),transparent_28%),linear-gradient(to_bottom,oklch(0.99_0_0),oklch(0.97_0.01_80))] text-foreground">
                <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
                    <header className="flex flex-col gap-4 border-b border-border/70 pb-6 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                PoofMQ funding
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Public funding summary
                            </h1>
                            <p className="max-w-2xl text-sm text-muted-foreground">
                                High-level funding status derived from Railway
                                workspace usage and a PoofMQ-attributed
                                estimate. Internal cost breakdowns stay in the
                                admin view.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link
                                href={home()}
                                className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted sm:w-auto"
                            >
                                Home
                            </Link>
                            <Link
                                href={dashboard()}
                                className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted sm:w-auto"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href={login()}
                                className="inline-flex w-full items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90 sm:w-auto"
                            >
                                Admin sign in
                            </Link>
                        </div>
                    </header>

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Card className="border-border/70 bg-card/95">
                            <CardHeader>
                                <CardTitle>Workspace usage</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                    {latest === null
                                        ? '$0.00'
                                        : formatCents(
                                              latest.workspace_current_spend_cents,
                                          )}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-border/70 bg-card/95">
                            <CardHeader>
                                <CardTitle>PoofMQ estimate</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                    {latest === null
                                        ? '$0.00'
                                        : formatCents(
                                              latest.poofmq_attributed_estimated_spend_cents,
                                          )}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-border/70 bg-card/95">
                            <CardHeader>
                                <CardTitle>Net funding</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                    {formatCents(
                                        funding.summary.net_funding_cents,
                                    )}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-border/70 bg-card/95">
                            <CardHeader>
                                <CardTitle>Funding gap</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                    {latest === null
                                        ? '$0.00'
                                        : formatCents(latest.funding_gap_cents)}
                                </p>
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                        <Card className="border-border/70 bg-card/95">
                            <CardHeader>
                                <CardTitle>What is public here</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                <p>
                                    This page shows the overall funding picture:
                                    workspace usage, a PoofMQ-attributed
                                    estimate, donations received, and the
                                    remaining funding gap.
                                </p>
                                <p>
                                    It does not expose internal service-level
                                    usage, credits, invoice internals, or
                                    operational alerts.
                                </p>
                                <p>
                                    Latest snapshot age:{' '}
                                    {formatAge(billing.snapshot_age_minutes)}.
                                    {billing.is_stale
                                        ? ' The public summary is currently stale.'
                                        : ' The summary is currently fresh.'}{' '}
                                    It refreshes every 5 minutes rather than
                                    continuously.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-border/70 bg-card/95">
                            <CardHeader>
                                <CardTitle>Current funding posture</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                                    <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                        Runway
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                                        {latest === null
                                            ? '0.00 months'
                                            : `${latest.runway_months.toFixed(2)} months`}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                                    <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                        Coverage
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                                        {latest === null
                                            ? '0%'
                                            : `${latest.coverage_percent.toFixed(2)}%`}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <section>
                        <Card className="border-border/70 bg-card/95">
                            <CardHeader>
                                <CardTitle>Snapshot history</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {billing.snapshots.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No historical funding snapshots yet.
                                    </p>
                                ) : (
                                    billing.snapshots.map((snapshot) => (
                                        <div
                                            key={snapshot.id}
                                            className="grid gap-2 rounded-lg border border-border/60 p-4 sm:grid-cols-2 xl:grid-cols-4"
                                        >
                                            <p className="text-sm font-medium">
                                                {new Date(
                                                    snapshot.captured_at,
                                                ).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Workspace:{' '}
                                                {formatCents(
                                                    snapshot.workspace_current_spend_cents,
                                                )}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                PoofMQ est:{' '}
                                                {formatCents(
                                                    snapshot.poofmq_attributed_estimated_spend_cents,
                                                )}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Gap:{' '}
                                                {formatCents(
                                                    snapshot.funding_gap_cents,
                                                )}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </div>
        </>
    );
}
