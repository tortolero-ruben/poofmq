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
            setStatusMessage('SANDBOX_QUEUE_CREATED_SUCCESSFULLY');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title="SANDBOX_QUEUE"
            description="Create a temporary queue for quick tests"
        >
            <Head title="Sandbox Queue" />

            <form className="space-y-6" onSubmit={handleCreateSandboxQueue}>
                <div className="grid gap-2">
                    <Label htmlFor="turnstile_token">TURNSTILE_TOKEN</Label>
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
                        ? 'CREATING_QUEUE...'
                        : 'CREATE_SANDBOX_QUEUE'}
                </Button>
            </form>

            {statusMessage !== null && (
                <div className="mt-6 border-4 border-green-500 bg-green-500/10 p-4">
                    <p className="font-bold text-green-400 uppercase">
                        {statusMessage}
                    </p>
                </div>
            )}

            {queue !== null && (
                <section className="mt-6 space-y-4 border-4 border-white bg-[#0a0a0a] p-4">
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-white/50 uppercase">
                            QUEUE_ID
                        </p>
                        <div className="border-2 border-white/20 bg-black px-4 py-2 font-mono text-sm break-all">
                            {queue.queue_id}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                void copyToClipboard(queue.queue_id);
                            }}
                        >
                            {copiedId ? 'COPIED_ID' : 'COPY_ID'}
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-bold text-white/50 uppercase">
                            QUEUE_URL
                        </p>
                        <div className="border-2 border-white/20 bg-black px-4 py-2 font-mono text-sm break-all">
                            {queue.queue_url}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                void copyToClipboard(queue.queue_url);
                            }}
                        >
                            {copiedUrl ? 'COPIED_URL' : 'COPY_URL'}
                        </Button>
                    </div>
                </section>
            )}

            <p className="mt-6 text-sm text-white/50">
                Need the main landing page?{' '}
                <Link
                    href={home()}
                    className="font-bold text-[#FFBF00] uppercase hover:underline"
                >
                    Go back home
                </Link>
            </p>
        </AuthLayout>
    );
}
