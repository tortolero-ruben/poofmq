import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
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

type FundingSummary = {
    gross_donations_cents: number;
    refunds_cents: number;
    net_funding_cents: number;
    event_count: number;
};

type FundingHistoryItem = {
    id: string;
    provider: string;
    provider_event_id: string;
    event_type: string;
    amount_cents: number;
    currency: string;
    donor_name: string | null;
    happened_at: string;
};

type BillingLatest = {
    balance_cents: number;
    month_to_date_spend_cents: number;
    runway_months: number;
    captured_at: string;
} | null;

type Billing = {
    latest: BillingLatest;
    trend: {
        balance_delta_cents: number;
        spend_delta_cents: number;
    };
};

type Capacity = {
    base_limit_per_minute: number;
    effective_limit_per_minute: number;
    is_boost_active: boolean;
    boost_multiplier: number | null;
    boost_expires_at: string | null;
};

type Alert = {
    key: string;
    severity: string;
    message: string;
    runbook: string;
};

type ObservabilityMetrics = {
    throughput_total: number;
    error_rate_percent: number;
    avg_push_latency_ms: number;
    avg_pop_latency_ms: number;
    redis_memory_bytes: number;
    burn_rate_cents_per_day: number;
};

type Observability = {
    metrics: ObservabilityMetrics;
    alerts: Alert[];
};

type DashboardProps = {
    funding: {
        summary: FundingSummary;
        history: FundingHistoryItem[];
    };
    billing: Billing;
    capacity: Capacity;
    observability: Observability;
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

function formatBytes(bytes: number): string {
    const megabytes = bytes / (1024 * 1024);

    return `${megabytes.toFixed(2)} MB`;
}

export default function Dashboard({
    funding,
    billing,
    capacity,
    observability,
}: DashboardProps) {
    const billingLatest = billing.latest;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-4 p-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Funding</CardTitle>
                            <CardDescription>
                                Donation ledger aggregate
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            <p>
                                Net:{' '}
                                {formatCents(funding.summary.net_funding_cents)}
                            </p>
                            <p>
                                Gross:{' '}
                                {formatCents(
                                    funding.summary.gross_donations_cents,
                                )}
                            </p>
                            <p>
                                Refunds:{' '}
                                {formatCents(funding.summary.refunds_cents)}
                            </p>
                            <p>Events: {funding.summary.event_count}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Railway Billing</CardTitle>
                            <CardDescription>
                                Latest balance and runway
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            {billingLatest === null ? (
                                <p>No billing snapshots yet.</p>
                            ) : (
                                <>
                                    <p>
                                        Balance:{' '}
                                        {formatCents(
                                            billingLatest.balance_cents,
                                        )}
                                    </p>
                                    <p>
                                        Spend MTD:{' '}
                                        {formatCents(
                                            billingLatest.month_to_date_spend_cents,
                                        )}
                                    </p>
                                    <p>
                                        Runway:{' '}
                                        {billingLatest.runway_months.toFixed(2)}{' '}
                                        months
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Capacity Limit</CardTitle>
                            <CardDescription>
                                Active Month Boost controls
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            <p>
                                Effective: {capacity.effective_limit_per_minute}{' '}
                                req/min
                            </p>
                            <p>
                                Baseline: {capacity.base_limit_per_minute}{' '}
                                req/min
                            </p>
                            {capacity.is_boost_active ? (
                                <Badge variant="secondary">
                                    Boost x{capacity.boost_multiplier}
                                </Badge>
                            ) : (
                                <Badge variant="outline">No active boost</Badge>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Observability</CardTitle>
                            <CardDescription>
                                Runtime SLO indicators
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            <p>
                                Throughput Total:{' '}
                                {observability.metrics.throughput_total} ops
                            </p>
                            <p>
                                Error rate:{' '}
                                {observability.metrics.error_rate_percent.toFixed(
                                    2,
                                )}
                                %
                            </p>
                            <p>
                                Redis memory:{' '}
                                {formatBytes(
                                    observability.metrics.redis_memory_bytes,
                                )}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Funding History</CardTitle>
                            <CardDescription>
                                Most recent donation ledger entries
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {funding.history.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No donation ledger entries yet.
                                </p>
                            ) : (
                                funding.history.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="rounded-md border px-3 py-2 text-sm"
                                    >
                                        <p className="font-medium">
                                            {entry.event_type}
                                        </p>
                                        <p className="text-muted-foreground">
                                            {formatCents(entry.amount_cents)}{' '}
                                            via {entry.provider}
                                        </p>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Active Alerts</CardTitle>
                            <CardDescription>
                                Threshold-driven operational alerts
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {observability.alerts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No active alerts.
                                </p>
                            ) : (
                                observability.alerts.map((alert) => (
                                    <div
                                        key={alert.key}
                                        className="rounded-md border px-3 py-2 text-sm"
                                    >
                                        <div className="mb-1 flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    alert.severity ===
                                                    'critical'
                                                        ? 'destructive'
                                                        : 'secondary'
                                                }
                                            >
                                                {alert.severity}
                                            </Badge>
                                            <span className="font-medium">
                                                {alert.key}
                                            </span>
                                        </div>
                                        <p>{alert.message}</p>
                                        <p className="text-muted-foreground">
                                            {alert.runbook}
                                        </p>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
