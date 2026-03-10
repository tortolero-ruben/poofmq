import { Head } from '@inertiajs/react';
import { QuickstartContent } from '@/components/quickstart-content';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { index as developersIndex } from '@/routes/developers';
import { quickstart as docsQuickstart } from '@/routes/docs';
import { index as startIndex } from '@/routes/start';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Developers', href: developersIndex() },
];

export default function Developers() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Developers" />
            <div
                className="flex h-full flex-1 flex-col gap-6 p-4 sm:gap-8 sm:p-6"
                data-testid="developers-page"
            >
                <div>
                    <h1
                        className="text-2xl font-semibold tracking-tight"
                        id="developers-heading"
                    >
                        Developers
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Start with a real queue in minutes. Everything you need
                        to push, pop, authenticate, and move into the SDKs is
                        here.
                    </p>
                </div>
                <QuickstartContent
                    quickstartHref={docsQuickstart.url()}
                    startHref={startIndex.url()}
                />
            </div>
        </AppLayout>
    );
}
