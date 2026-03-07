import { Head } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { QuickstartContent } from '@/components/quickstart-content';
import { home } from '@/routes';
import { index as startIndex } from '@/routes/start';

export default function Quickstart() {
    return (
        <>
            <Head title="Quickstart" />
            <main className="min-h-screen bg-background">
                <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <a
                            href={home.url()}
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
                        >
                            <ChevronLeft className="size-4" />
                            Back to Home
                        </a>
                        <div className="mt-6">
                            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Documentation
                            </p>
                            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                                Quickstart
                            </h1>
                            <p className="mt-4 max-w-3xl text-muted-foreground">
                                Start instantly with a real queue, or get a free
                                developer key for reusable access. Use the HTTP
                                quickstart to prove the flow, then switch the
                                shared SDK guide between Node and Python without
                                changing the underlying concepts.
                            </p>
                        </div>
                    </div>
                    <QuickstartContent
                        quickstartHref={'/docs/quickstart'}
                        startHref={startIndex.url()}
                    />
                </div>
            </main>
        </>
    );
}
