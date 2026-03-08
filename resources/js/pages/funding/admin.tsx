import { Head, Link, usePage } from '@inertiajs/react';
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

type BillingUsageItem = {
    measurement: string;
    label: string;
    value: number;
    service_id: string | null;
    service_name: string | null;
};

type EstimatedUsageItem = {
    measurement: string;
    label: string;
    estimated_value: number;
};

type BillingLatest = {
    workspace_current_spend_cents: number;
    workspace_estimated_spend_cents: number;
    poofmq_attributed_current_spend_cents: number;
    poofmq_attributed_estimated_spend_cents: number;
    funding_gap_cents: number;
    runway_months: number;
    latest_invoice_total_cents: number | null;
    credit_balance_cents: number;
    applied_credits_cents: number;
    coverage_percent: number;
    captured_at: string;
    billing_period_starts_at: string | null;
    billing_period_ends_at: string | null;
    breakdown: {
        current_usage: BillingUsageItem[];
        workspace_usage: BillingUsageItem[];
        estimated_usage: EstimatedUsageItem[];
        workspace_estimated_usage: EstimatedUsageItem[];
    };
} | null;

type Billing = {
    latest: BillingLatest;
    trend: {
        current_spend_delta_cents: number;
        estimated_spend_delta_cents: number;
        funding_gap_delta_cents: number;
    };
    snapshots: {
        id: string;
        workspace_current_spend_cents: number;
        poofmq_attributed_estimated_spend_cents: number;
        funding_gap_cents: number;
        captured_at: string;
    }[];
    is_stale: boolean;
    snapshot_age_minutes: number | null;
};

type Props = {
    funding: {
        summary: FundingSummary;
        history: FundingHistoryItem[];
    };
    billing: Billing;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Funding Admin',
        href: fundingAdmin(),
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

function MetricRow({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2 first:pt-0 last:border-b-0 last:pb-0">
            <span className="text-xs font-medium tracking-wide text-muted-foreground">
                {label}
            </span>
            <span className="font-mono text-sm text-foreground">{value}</span>
        </div>
    );
}

export default function FundingAdminPage({ funding, billing }: Props) {
    const billingLatest = billing.latest;
    const { auth } = usePage().props as { auth: { is_admin: boolean } };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Funding Admin" />

            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                            Internal funding operations
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Admin-only Railway funding detail
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <Button asChild variant="outline">
                            <Link href={fundingIndex()}>Open public page</Link>
                        </Button>
                        {auth.is_admin && <Badge>Admin</Badge>}
                    </div>
                </div>

                {billingLatest !== null && (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Workspace usage</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-semibold tracking-tight">
                                    {formatCents(
                                        billingLatest.workspace_current_spend_cents,
                                    )}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>PoofMQ estimate</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-semibold tracking-tight">
                                    {formatCents(
                                        billingLatest.poofmq_attributed_estimated_spend_cents,
                                    )}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Funding gap</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-semibold tracking-tight">
                                    {formatCents(
                                        billingLatest.funding_gap_cents,
                                    )}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Runway</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-semibold tracking-tight">
                                    {billingLatest.runway_months.toFixed(2)}{' '}
                                    months
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cost internals</CardTitle>
                            <CardDescription>
                                Sensitive funding internals visible only to
                                admins
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {billingLatest === null ? (
                                <p className="text-sm text-muted-foreground">
                                    No funding snapshot has been recorded yet.
                                </p>
                            ) : (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-xl border border-border/70 p-4">
                                            <MetricRow
                                                label="Latest invoice"
                                                value={
                                                    billingLatest.latest_invoice_total_cents ===
                                                    null
                                                        ? 'N/A'
                                                        : formatCents(
                                                              billingLatest.latest_invoice_total_cents,
                                                          )
                                                }
                                            />
                                            <MetricRow
                                                label="Credit balance"
                                                value={formatCents(
                                                    billingLatest.credit_balance_cents,
                                                )}
                                            />
                                            <MetricRow
                                                label="Applied credits"
                                                value={formatCents(
                                                    billingLatest.applied_credits_cents,
                                                )}
                                            />
                                            <MetricRow
                                                label="Coverage"
                                                value={`${billingLatest.coverage_percent.toFixed(2)}%`}
                                            />
                                            <MetricRow
                                                label="Attribution"
                                                value={formatCents(
                                                    billingLatest.poofmq_attributed_current_spend_cents,
                                                )}
                                            />
                                        </div>
                                        <div className="rounded-xl border border-border/70 p-4">
                                            <MetricRow
                                                label="Captured at"
                                                value={new Date(
                                                    billingLatest.captured_at,
                                                ).toLocaleString()}
                                            />
                                            <MetricRow
                                                label="Period start"
                                                value={
                                                    billingLatest.billing_period_starts_at ===
                                                    null
                                                        ? 'N/A'
                                                        : new Date(
                                                              billingLatest.billing_period_starts_at,
                                                          ).toLocaleString()
                                                }
                                            />
                                            <MetricRow
                                                label="Period end"
                                                value={
                                                    billingLatest.billing_period_ends_at ===
                                                    null
                                                        ? 'N/A'
                                                        : new Date(
                                                              billingLatest.billing_period_ends_at,
                                                          ).toLocaleString()
                                                }
                                            />
                                            <MetricRow
                                                label="Snapshot age"
                                                value={`${billing.snapshot_age_minutes ?? 0} min`}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-3 rounded-xl border border-border/70 p-4">
                                            <h2 className="font-semibold tracking-tight">
                                                PoofMQ usage by service
                                            </h2>
                                            <div className="space-y-2">
                                                {billingLatest.breakdown.current_usage.map(
                                                    (item) => (
                                                        <MetricRow
                                                            key={`${item.measurement}-${item.service_id ?? 'project'}`}
                                                            label={
                                                                item.service_name ===
                                                                null
                                                                    ? item.label
                                                                    : `${item.service_name} ${item.label}`
                                                            }
                                                            value={item.value.toFixed(
                                                                4,
                                                            )}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-3 rounded-xl border border-border/70 p-4">
                                            <h2 className="font-semibold tracking-tight">
                                                Workspace usage totals
                                            </h2>
                                            <div className="space-y-2">
                                                {billingLatest.breakdown.workspace_usage.map(
                                                    (item) => (
                                                        <MetricRow
                                                            key={`${item.measurement}-${item.service_id ?? 'workspace'}`}
                                                            label={
                                                                item.service_name ===
                                                                null
                                                                    ? item.label
                                                                    : `${item.service_name} ${item.label}`
                                                            }
                                                            value={item.value.toFixed(
                                                                4,
                                                            )}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-3 rounded-xl border border-border/70 p-4">
                                            <h2 className="font-semibold tracking-tight">
                                                PoofMQ estimated month-end usage
                                            </h2>
                                            <div className="space-y-2">
                                                {billingLatest.breakdown.estimated_usage.map(
                                                    (item) => (
                                                        <MetricRow
                                                            key={
                                                                item.measurement
                                                            }
                                                            label={item.label}
                                                            value={item.estimated_value.toFixed(
                                                                4,
                                                            )}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-3 rounded-xl border border-border/70 p-4">
                                            <h2 className="font-semibold tracking-tight">
                                                Workspace estimated month-end
                                                usage
                                            </h2>
                                            <div className="space-y-2">
                                                {billingLatest.breakdown.workspace_estimated_usage.map(
                                                    (item) => (
                                                        <MetricRow
                                                            key={`workspace-${item.measurement}`}
                                                            label={item.label}
                                                            value={item.estimated_value.toFixed(
                                                                4,
                                                            )}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Funding ledger</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {funding.history.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="rounded-lg border border-border/60 p-3"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-medium">
                                                {entry.donor_name ??
                                                    entry.provider}
                                            </p>
                                            <p className="font-mono text-sm">
                                                {formatCents(
                                                    entry.amount_cents,
                                                )}
                                            </p>
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {entry.event_type} on{' '}
                                            {new Date(
                                                entry.happened_at,
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Trend deltas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <MetricRow
                                    label="Current spend"
                                    value={formatCents(
                                        billing.trend.current_spend_delta_cents,
                                    )}
                                />
                                <MetricRow
                                    label="Projected spend"
                                    value={formatCents(
                                        billing.trend
                                            .estimated_spend_delta_cents,
                                    )}
                                />
                                <MetricRow
                                    label="Funding gap"
                                    value={formatCents(
                                        billing.trend.funding_gap_delta_cents,
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
