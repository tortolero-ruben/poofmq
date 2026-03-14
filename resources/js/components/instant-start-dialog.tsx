import { usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useClipboard } from '@/hooks/use-clipboard';
import { jsonHeaders } from '@/lib/utils';

type ValidationErrors = Record<string, string[]>;

type InstantStartDialogProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
};

type SandboxQueueResponse = {
    queue_id: string;
    queue_url: string;
};

type InstantStartPageProps = {
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

export default function InstantStartDialog({
    isOpen,
    onOpenChange,
}: InstantStartDialogProps) {
    const {
        turnstile: { siteKey },
    } = usePage<InstantStartPageProps>().props;
    const [turnstileToken, setTurnstileToken] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [queue, setQueue] = useState<SandboxQueueResponse | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [copiedValue, copyToClipboard] = useClipboard();
    const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
    const turnstileWidgetIdRef = useRef<string | null>(null);
    const isLocalDevelopment =
        typeof window !== 'undefined' &&
        ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

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

    const removeTurnstile = useCallback(() => {
        if (
            turnstileWidgetIdRef.current === null ||
            window.turnstile === undefined
        ) {
            return;
        }

        window.turnstile.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
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
            window.turnstile === undefined ||
            !isOpen
        ) {
            return;
        }

        removeTurnstile();

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
    }, [clearTurnstileError, isOpen, removeTurnstile, siteKey]);

    useEffect(() => {
        if (!isOpen || siteKey === null || isLocalDevelopment) {
            return;
        }

        if (window.turnstile !== undefined) {
            renderTurnstile();

            return () => {
                removeTurnstile();
            };
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
                removeTurnstile();
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
            removeTurnstile();
        };
    }, [isLocalDevelopment, isOpen, removeTurnstile, renderTurnstile, siteKey]);

    const handleOpenChange = (open: boolean) => {
        onOpenChange(open);

        if (!open) {
            setErrors({});
            setStatusMessage(null);
            setQueue(null);
            setTurnstileToken('');
            removeTurnstile();
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setStatusMessage(null);
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/instant/queues', {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify({
                    turnstile_token: isLocalDevelopment
                        ? 'local-development-bypass'
                        : turnstileToken,
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
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader className="pb-6">
                    <DialogTitle className="text-xl">
                        START INSTANTLY
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Complete verification, create a free queue, and start
                        pushing messages immediately.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="grid gap-2">
                        {isLocalDevelopment ? (
                            <Alert>
                                <AlertTitle>
                                    Local development bypass active
                                </AlertTitle>
                                <AlertDescription>
                                    Turnstile is skipped on localhost.
                                </AlertDescription>
                            </Alert>
                        ) : siteKey === null ? (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    Turnstile site key is not configured.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div
                                ref={turnstileContainerRef}
                                className="flex min-h-16 items-center justify-center rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground"
                            >
                                <span className="animate-pulse">
                                    Loading verification...
                                </span>
                            </div>
                        )}
                        <InputError message={errors.turnstile_token} />
                    </div>

                    <Button
                        type="submit"
                        disabled={
                            isSubmitting ||
                            (!isLocalDevelopment &&
                                turnstileToken.length === 0) ||
                            siteKey === null
                        }
                        className="h-12 w-full text-base"
                    >
                        {isSubmitting
                            ? 'Creating queue...'
                            : 'Create queue now'}
                    </Button>
                </form>

                {statusMessage !== null && (
                    <Alert variant="success">
                        <AlertDescription>{statusMessage}</AlertDescription>
                    </Alert>
                )}

                {queue !== null && (
                    <section className="space-y-4 rounded-xl border border-border bg-muted/40 p-4">
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                                Queue ID
                            </p>
                            <div className="rounded-lg border border-border bg-background px-4 py-2 font-mono text-sm break-all">
                                {queue.queue_id}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    void copyToClipboard(queue.queue_id);
                                }}
                                className="w-full"
                            >
                                {copiedId ? 'Copied ID' : 'Copy ID'}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                                Queue URL
                            </p>
                            <div className="rounded-lg border border-border bg-background px-4 py-2 font-mono text-sm break-all">
                                {queue.queue_url}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    void copyToClipboard(queue.queue_url);
                                }}
                                className="w-full"
                            >
                                {copiedUrl ? 'Copied URL' : 'Copy URL'}
                            </Button>
                        </div>
                    </section>
                )}
            </DialogContent>
        </Dialog>
    );
}
