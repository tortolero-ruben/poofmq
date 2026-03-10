import { Head, Link, usePage } from '@inertiajs/react';
import KoFiButton from '@/components/ko-fi-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { admin as fundingAdmin, index as fundingIndex } from '@/routes/funding';

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

type Billing = {
    latest: BillingLatest;
    trend: {
        workspace_current_spend_delta_cents: number;
        poofmq_attributed_estimated_spend_delta_cents: number;
        funding_gap_delta_cents: number;
    };
    is_stale: boolean;
    snapshot_age_minutes: number | null;
};

type Capacity = {
    base_limit_per_minute: number;
    effective_limit_per_minute: number;
    is_boost_active: boolean;
    boost_multiplier: number | null;
};

type Alert = {
    key: string;
    severity: string;
    message: string;
};

type Observability = {
    metrics: {
        throughput_total: number;
        error_rate_percent: number;
        burn_rate_cents_per_day: number;
        railway_snapshot_age_minutes: number;
    };
    alerts: Alert[];
};

type DashboardProps = {
    funding: {
        summary: FundingSummary;
    };
    billing: Billing;
    admin: {
        capacity: Capacity;
        observability: Observability;
    } | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

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
        return `${minutes} min`;
    }

    return `${(minutes / 60).toFixed(1)} hr`;
}

export default function Dashboard({ funding, billing, admin }: DashboardProps) {
    const { auth, donationUrl } = usePage().props as {
        auth: { is_admin: boolean };
        donationUrl: string | null;
    };
    const billingLatest = billing.latest;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-6 p-4 sm:p-6">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
                    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">
                                Funding overview
                            </p>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Shared summary for all users
                            </h1>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                                asChild
                                variant="outline"
                                className="w-full sm:w-auto"
                            >
                                <Link href={fundingIndex()}>
                                    Public funding page
                                </Link>
                            </Button>
                            {auth.is_admin && (
                                <Button asChild className="w-full sm:w-auto">
                                    <Link href={fundingAdmin()}>
                                        Admin funding details
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {donationUrl && (
                        <div className="rounded-2xl border border-[#72a4f2]/40 bg-linear-to-br from-[#72a4f2]/14 via-background to-background p-5 shadow-[0_18px_60px_rgba(114,164,242,0.12)]">
                            <p className="text-xs font-semibold tracking-[0.2em] text-[#72a4f2] uppercase">
                                Community funded
                            </p>
                            <h2 className="mt-2 text-xl font-semibold tracking-tight">
                                Keep PoofMQ free for everyone
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Donations help cover hosting and queue
                                infrastructure so the public free tier can stay
                                online.
                            </p>
                            <KoFiButton
                                href={donationUrl}
                                className="mt-4 w-full sm:w-auto"
                            />
                        </div>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Net funding</CardTitle>
                            <CardDescription>
                                Donations minus refunds
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                {formatCents(funding.summary.net_funding_cents)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Current spend</CardTitle>
                            <CardDescription>
                                Railway workspace usage snapshot
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                {billingLatest === null
                                    ? '$0.00'
                                    : formatCents(
                                          billingLatest.workspace_current_spend_cents,
                                      )}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>PoofMQ estimate</CardTitle>
                            <CardDescription>
                                Project-attributed estimate, not invoice exact
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                {billingLatest === null
                                    ? '$0.00'
                                    : formatCents(
                                          billingLatest.poofmq_attributed_estimated_spend_cents,
                                      )}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Funding gap</CardTitle>
                            <CardDescription>
                                Remaining projected shortfall
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                {billingLatest === null
                                    ? '$0.00'
                                    : formatCents(
                                          billingLatest.funding_gap_cents,
                                      )}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Funding posture</CardTitle>
                            <CardDescription>
                                Summary funding data without internal cost
                                breakdowns
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {billingLatest === null ? (
                                <p className="text-sm text-muted-foreground">
                                    No Railway funding snapshot has been
                                    recorded yet.
                                </p>
                            ) : (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                                            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                                Runway
                                            </p>
                                            <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                                                {billingLatest.runway_months.toFixed(
                                                    2,
                                                )}{' '}
                                                months
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                                            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                                Coverage
                                            </p>
                                            <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                                                {billingLatest.coverage_percent.toFixed(
                                                    2,
                                                )}
                                                %
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-sm font-medium">
                                                Snapshot status
                                            </p>
                                            {billing.is_stale ? (
                                                <Badge variant="destructive">
                                                    Stale
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    Fresh
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Last updated{' '}
                                            {new Date(
                                                billingLatest.captured_at,
                                            ).toLocaleString()}{' '}
                                            with snapshot age{' '}
                                            {formatAge(
                                                billing.snapshot_age_minutes,
                                            )}
                                            . This refreshes every 5 minutes,
                                            not continuously.
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Access split</CardTitle>
                            <CardDescription>
                                Public versus admin-only information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p>
                                Public and regular-user views show workspace
                                usage plus a PoofMQ-attributed estimate only.
                            </p>
                            <p>
                                Admin-only views include service-level usage,
                                invoice totals, credits, ledger detail, and
                                operational observability.
                            </p>
                            {auth.is_admin ? (
                                <p>
                                    Your account can open the admin funding
                                    page.
                                </p>
                            ) : (
                                <p>
                                    Your account does not receive internal cost
                                    breakdowns.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {auth.is_admin && admin !== null && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Admin capacity</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p>
                                    Effective limit:{' '}
                                    {admin.capacity.effective_limit_per_minute}{' '}
                                    req/min
                                </p>
                                <p>
                                    Baseline:{' '}
                                    {admin.capacity.base_limit_per_minute}{' '}
                                    req/min
                                </p>
                                <p>
                                    Boost:{' '}
                                    {admin.capacity.is_boost_active
                                        ? `x${admin.capacity.boost_multiplier}`
                                        : 'inactive'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Admin observability</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p>
                                    Throughput:{' '}
                                    {
                                        admin.observability.metrics
                                            .throughput_total
                                    }{' '}
                                    ops
                                </p>
                                <p>
                                    Error rate:{' '}
                                    {
                                        admin.observability.metrics
                                            .error_rate_percent
                                    }
                                    %
                                </p>
                                <p>
                                    Burn rate:{' '}
                                    {
                                        admin.observability.metrics
                                            .burn_rate_cents_per_day
                                    }{' '}
                                    cents/day
                                </p>
                                <p>
                                    Alerts: {admin.observability.alerts.length}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
