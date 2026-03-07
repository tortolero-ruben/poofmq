import { Head, Link, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import AuthLayout from '@/layouts/auth-layout';
import { jsonHeaders } from '@/lib/utils';
import { home } from '@/routes';
import { store as storeInstantQueue } from '@/routes/api/instant/queues';

type ValidationErrors = Record<string, string[]>;

type SandboxQueueResponse = {
    queue_id: string;
    queue_url: string;
};

type SandboxPageProps = {
    turnstile: {
        siteKey: string | null;
    };
};

type TurnstileOptions = {
    callback: (token: string) => void;
    'error-callback': () => void;
    'expired-callback': () => void;
    sitekey: string;
    theme: 'dark' | 'light' | 'auto';
};

declare global {
    interface Window {
        turnstile?: {
            remove: (widgetId: string) => void;
            render: (
                container: HTMLElement,
                options: TurnstileOptions,
            ) => string;
            reset: (widgetId: string) => void;
        };
    }
}

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
    const {
        turnstile: { siteKey },
    } = usePage<SandboxPageProps>().props;
    const [turnstileToken, setTurnstileToken] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [queue, setQueue] = useState<SandboxQueueResponse | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [copiedValue, copyToClipboard] = useClipboard();
    const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
    const turnstileWidgetIdRef = useRef<string | null>(null);

    const copiedId = useMemo(
        () => queue !== null && copiedValue === queue.queue_id,
        [copiedValue, queue],
    );
    const copiedUrl = useMemo(
        () => queue !== null && copiedValue === queue.queue_url,
        [copiedValue, queue],
    );

    const clearTurnstileError = useCallback(() => {
        setErrors((currentErrors) => {
            const nextErrors = { ...currentErrors };
            delete nextErrors.turnstile_token;

            return nextErrors;
        });
    }, []);

    const resetTurnstile = useCallback(() => {
        setTurnstileToken('');

        if (
            turnstileWidgetIdRef.current !== null &&
            window.turnstile !== undefined
        ) {
            window.turnstile.reset(turnstileWidgetIdRef.current);
        }
    }, []);

    const renderTurnstile = useCallback(() => {
        if (
            siteKey === null ||
            turnstileContainerRef.current === null ||
            window.turnstile === undefined
        ) {
            return;
        }

        if (turnstileWidgetIdRef.current !== null) {
            window.turnstile.remove(turnstileWidgetIdRef.current);
            turnstileWidgetIdRef.current = null;
        }

        turnstileWidgetIdRef.current = window.turnstile.render(
            turnstileContainerRef.current,
            {
                sitekey: siteKey,
                theme: 'dark',
                callback: (token: string) => {
                    setTurnstileToken(token);
                    clearTurnstileError();
                },
                'expired-callback': () => {
                    setTurnstileToken('');
                    setErrors((currentErrors) => ({
                        ...currentErrors,
                        turnstile_token:
                            'Turnstile verification expired. Try again.',
                    }));
                },
                'error-callback': () => {
                    setTurnstileToken('');
                    setErrors((currentErrors) => ({
                        ...currentErrors,
                        turnstile_token:
                            'Turnstile failed to load. Refresh and try again.',
                    }));
                },
            },
        );
    }, [clearTurnstileError, siteKey]);

    useEffect(() => {
        if (siteKey === null) {
            return;
        }

        if (window.turnstile !== undefined) {
            renderTurnstile();

            return;
        }

        const source =
            'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        const existingScript = document.querySelector<HTMLScriptElement>(
            `script[src="${source}"]`,
        );

        const handleLoad = () => {
            renderTurnstile();
        };

        if (existingScript !== null) {
            existingScript.addEventListener('load', handleLoad);

            return () => {
                existingScript.removeEventListener('load', handleLoad);
            };
        }

        const script = document.createElement('script');
        script.src = source;
        script.async = true;
        script.defer = true;
        script.addEventListener('load', handleLoad);
        document.head.appendChild(script);

        return () => {
            script.removeEventListener('load', handleLoad);
        };
    }, [renderTurnstile, siteKey]);

    const handleCreateSandboxQueue = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setStatusMessage(null);
        setIsSubmitting(true);

        try {
            const response = await fetch(storeInstantQueue.url(), {
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

                resetTurnstile();

                return;
            }

            if (!response.ok) {
                setErrors({
                    turnstile_token: 'Unable to create a queue right now.',
                });
                resetTurnstile();

                return;
            }

            setQueue(payload as SandboxQueueResponse);
            setErrors({});
            setStatusMessage('QUEUE_CREATED_SUCCESSFULLY');
            resetTurnstile();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title="START_INSTANTLY"
            description="Create a free queue and start pushing messages right away"
        >
            <Head title="Start Instantly" />

            <form className="space-y-5" onSubmit={handleCreateSandboxQueue}>
                <div className="grid gap-2">
                    {siteKey === null ? (
                        <div className="border-4 border-red-500 bg-red-500/10 p-4 text-sm font-bold text-red-300 uppercase">
                            Turnstile site key is not configured.
                        </div>
                    ) : (
                        <div
                            ref={turnstileContainerRef}
                            className="flex min-h-16 items-center justify-center border-4 border-white/40 bg-black/50 p-4 text-sm text-white/30"
                        >
                            <span className="animate-pulse">
                                Loading Verification...
                            </span>
                        </div>
                    )}
                    <InputError message={errors.turnstile_token} />
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting || turnstileToken.length === 0}
                    className="h-12 w-full text-base font-black uppercase"
                >
                    {isSubmitting ? 'Creating Queue...' : 'Create Queue Now'}
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
