import { Head } from '@inertiajs/react';
import { BookOpen, Code2, FileCode } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as developersIndex } from '@/routes/developers';
import type { BreadcrumbItem } from '@/types';

const REPOSITORY_URL = 'https://github.com/tortolero-ruben/poofmq';
const QUICKSTART_URL = `${REPOSITORY_URL}/blob/main/docs/quickstart.md`;
const NODE_SDK_URL = `${REPOSITORY_URL}/blob/main/sdks/node/README.md`;
const PYTHON_SDK_URL = `${REPOSITORY_URL}/blob/main/sdks/python/README.md`;

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Developers', href: developersIndex() },
];

export default function Developers() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Developers" />
            <div
                className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4"
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
                        Quickstart and SDK docs for the poofMQ API.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div
                        className="flex items-center gap-3 rounded-lg border border-sidebar-border/70 bg-card p-4 dark:border-sidebar-border"
                        data-testid="quickstart-link"
                    >
                        <BookOpen className="size-8 text-muted-foreground" />
                        <div>
                            <span className="font-medium">Quickstart</span>
                            <p className="text-sm text-muted-foreground">
                                See{' '}
                                <a
                                    className="font-medium underline underline-offset-2"
                                    href={QUICKSTART_URL}
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    docs/quickstart.md
                                </a>{' '}
                                for API base URL, Node and Python snippets.
                            </p>
                        </div>
                    </div>
                    <div
                        className="flex items-center gap-3 rounded-lg border border-sidebar-border/70 bg-card p-4 dark:border-sidebar-border"
                        data-testid="node-sdk-link"
                    >
                        <Code2 className="size-8 text-muted-foreground" />
                        <div>
                            <span className="font-medium">Node.js SDK</span>
                            <p className="text-sm text-muted-foreground">
                                See{' '}
                                <a
                                    className="font-medium underline underline-offset-2"
                                    href={NODE_SDK_URL}
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    sdks/node/README.md
                                </a>{' '}
                                for TypeScript/JavaScript client and encryption.
                            </p>
                        </div>
                    </div>
                    <div
                        className="flex items-center gap-3 rounded-lg border border-sidebar-border/70 bg-card p-4 dark:border-sidebar-border"
                        data-testid="python-sdk-link"
                    >
                        <FileCode className="size-8 text-muted-foreground" />
                        <div>
                            <span className="font-medium">Python SDK</span>
                            <p className="text-sm text-muted-foreground">
                                See{' '}
                                <a
                                    className="font-medium underline underline-offset-2"
                                    href={PYTHON_SDK_URL}
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    sdks/python/README.md
                                </a>{' '}
                                for Python client and encryption.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
