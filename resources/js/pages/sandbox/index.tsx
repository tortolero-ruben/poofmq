import { Head, Link } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClipboard } from '@/hooks/use-clipboard';
import AuthLayout from '@/layouts/auth-layout';
import { jsonHeaders } from '@/lib/utils';
import { home } from '@/routes';
import { store as storeSandboxQueue } from '@/routes/api/sandbox/queues';

type ValidationErrors = Record<string, string[]>;

type SandboxQueueResponse = {
    queue_id: string;
    queue_url: string;
};

function mapValidationErrors(
    errors: ValidationErrors | undefined,
): Record<string, string> {
    if (errors === undefined) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [
            field,
            messages[0] ?? 'Invalid value.',
        ]),
    );
}

export default function SandboxCreatePage() {
    const [turnstileToken, setTurnstileToken] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [queue, setQueue] = useState<SandboxQueueResponse | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [copiedValue, copyToClipboard] = useClipboard();

    const copiedId = useMemo(
        () => queue !== null && copiedValue === queue.queue_id,
        [copiedValue, queue],
    );
    const copiedUrl = useMemo(
        () => queue !== null && copiedValue === queue.queue_url,
        [copiedValue, queue],
    );

    const handleCreateSandboxQueue = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setStatusMessage(null);
        setIsSubmitting(true);

        try {
            const response = await fetch(storeSandboxQueue.url(), {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify({
                    turnstile_token: turnstileToken,
                }),
            });

            const payload = await response.json();

            if (response.status === 422) {
                if ('errors' in payload) {
                    setErrors(
                        mapValidationErrors(payload.errors as ValidationErrors),
                    );
                } else {
                    setErrors({
                        turnstile_token:
                            (payload.message as string) ??
                            'Turnstile verification failed.',
                    });
                }

                return;
            }

            if (!response.ok) {
                setErrors({
                    turnstile_token:
                        'Unable to create a sandbox queue right now.',
                });

                return;
            }

            setQueue(payload as SandboxQueueResponse);
            setErrors({});
            setStatusMessage('Sandbox queue created successfully.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title="Sandbox queue"
            description="Create a temporary queue for quick tests with Turnstile protection."
        >
            <Head title="Sandbox queue" />

            <form className="space-y-4" onSubmit={handleCreateSandboxQueue}>
                <div className="grid gap-2">
                    <Label htmlFor="turnstile_token">Turnstile token</Label>
                    <Input
                        id="turnstile_token"
                        value={turnstileToken}
                        onChange={(event) =>
                            setTurnstileToken(event.target.value)
                        }
                        placeholder="Paste your Turnstile token"
                        required
                    />
                    <InputError message={errors.turnstile_token} />
                </div>

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? 'Creating queue...'
                        : 'Create sandbox queue'}
                </Button>
            </form>

            {statusMessage !== null && (
                <p className="mt-4 text-sm font-medium text-green-600">
                    {statusMessage}
                </p>
            )}

            {queue !== null && (
                <section className="mt-6 space-y-3 rounded-xl border border-sidebar-border/70 p-4">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                            Queue ID
                        </p>
                        <p className="rounded-md border bg-muted/20 px-3 py-2 font-mono text-sm break-all">
                            {queue.queue_id}
                        </p>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                void copyToClipboard(queue.queue_id);
                            }}
                        >
                            {copiedId ? 'Copied ID' : 'Copy ID'}
                        </Button>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                            Queue URL
                        </p>
                        <p className="rounded-md border bg-muted/20 px-3 py-2 font-mono text-sm break-all">
                            {queue.queue_url}
                        </p>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                void copyToClipboard(queue.queue_url);
                            }}
                        >
                            {copiedUrl ? 'Copied URL' : 'Copy URL'}
                        </Button>
                    </div>
                </section>
            )}

            <p className="mt-6 text-sm text-muted-foreground">
                Need the main landing page?{' '}
                <Link href={home()} className="underline">
                    Go back home.
                </Link>
            </p>
        </AuthLayout>
    );
}
