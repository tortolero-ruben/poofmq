import { Head } from '@inertiajs/react';
import { QuickstartContent } from '@/components/quickstart-content';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { quickstart as docsQuickstart } from '@/routes/docs';
import { index as startIndex } from '@/routes/start';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Quickstart', href: docsQuickstart.url() },
];

export default function Quickstart() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Quickstart" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:gap-8 sm:p-6">
                <div>
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
            </div>
        </AppLayout>
    );
}
