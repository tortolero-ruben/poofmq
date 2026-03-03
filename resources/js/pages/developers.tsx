import { Head } from '@inertiajs/react';
import { BookOpen, Code2, FileCode } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { index as developersIndex } from '@/routes/developers';

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
                className="flex h-full flex-1 flex-col gap-6 p-6"
                data-testid="developers-page"
            >
                <div>
                    <h1
                        className="text-2xl font-bold tracking-wide uppercase"
                        id="developers-heading"
                    >
                        DEVELOPERS
                    </h1>
                    <p className="mt-1 text-white/60">
                        Quickstart and SDK docs for the poofMQ API.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <a
                        href={QUICKSTART_URL}
                        rel="noreferrer"
                        target="_blank"
                        className="group border-4 border-white bg-[#0a0a0a] p-6 transition-colors hover:bg-[#FFBF00] hover:text-black"
                        data-testid="quickstart-link"
                    >
                        <div className="flex items-start gap-4">
                            <BookOpen className="size-8 text-[#FFBF00] group-hover:text-black" />
                            <div>
                                <span className="font-bold uppercase">
                                    QUICKSTART
                                </span>
                                <p className="mt-2 text-sm text-white/60 group-hover:text-black/70">
                                    See{' '}
                                    <span className="font-mono">
                                        docs/quickstart.md
                                    </span>{' '}
                                    for API base URL, Node and Python snippets.
                                </p>
                            </div>
                        </div>
                    </a>
                    <a
                        href={NODE_SDK_URL}
                        rel="noreferrer"
                        target="_blank"
                        className="group border-4 border-white bg-[#0a0a0a] p-6 transition-colors hover:bg-[#FFBF00] hover:text-black"
                        data-testid="node-sdk-link"
                    >
                        <div className="flex items-start gap-4">
                            <Code2 className="size-8 text-[#FFBF00] group-hover:text-black" />
                            <div>
                                <span className="font-bold uppercase">
                                    NODE_JS_SDK
                                </span>
                                <p className="mt-2 text-sm text-white/60 group-hover:text-black/70">
                                    See{' '}
                                    <span className="font-mono">
                                        sdks/node/README.md
                                    </span>{' '}
                                    for TypeScript/JavaScript client and
                                    encryption.
                                </p>
                            </div>
                        </div>
                    </a>
                    <a
                        href={PYTHON_SDK_URL}
                        rel="noreferrer"
                        target="_blank"
                        className="group border-4 border-white bg-[#0a0a0a] p-6 transition-colors hover:bg-[#FFBF00] hover:text-black"
                        data-testid="python-sdk-link"
                    >
                        <div className="flex items-start gap-4">
                            <FileCode className="size-8 text-[#FFBF00] group-hover:text-black" />
                            <div>
                                <span className="font-bold uppercase">
                                    PYTHON_SDK
                                </span>
                                <p className="mt-2 text-sm text-white/60 group-hover:text-black/70">
                                    See{' '}
                                    <span className="font-mono">
                                        sdks/python/README.md
                                    </span>{' '}
                                    for Python client and encryption.
                                </p>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        </AppLayout>
    );
}
