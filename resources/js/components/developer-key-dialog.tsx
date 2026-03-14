import { Link, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClipboard } from '@/hooks/use-clipboard';
import { jsonHeaders } from '@/lib/utils';
import { login } from '@/routes';

type ValidationErrors = Record<string, string[]>;

type DeveloperKeyDialogProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
};

type DeveloperKeySuccess = {
    claim_url: string;
    message: string;
    plain_text_key: string;
    project_name: string;
};

type DeveloperKeyPageProps = {
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

export default function DeveloperKeyDialog({
    isOpen,
    onOpenChange,
}: DeveloperKeyDialogProps) {
    const {
        turnstile: { siteKey },
    } = usePage<DeveloperKeyPageProps>().props;
    const [email, setEmail] = useState<string>('');
    const [turnstileToken, setTurnstileToken] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [success, setSuccess] = useState<DeveloperKeySuccess | null>(null);
    const [copiedValue, copyToClipboard] = useClipboard();
    const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
    const turnstileWidgetIdRef = useRef<string | null>(null);
    const isLocalDevelopment =
        typeof window !== 'undefined' &&
        ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

    const copiedKey = useMemo(
        () => success !== null && copiedValue === success.plain_text_key,
        [copiedValue, success],
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
            window.turnstile === undefined ||
            !isOpen
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
    }, [clearTurnstileError, isOpen, siteKey]);

    useEffect(() => {
        if (!isOpen || siteKey === null || isLocalDevelopment) {
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
    }, [isLocalDevelopment, isOpen, renderTurnstile, siteKey]);

    const handleOpenChange = (open: boolean) => {
        onOpenChange(open);

        if (!open) {
            setErrors({});
            setStatusMessage(null);
            setSuccess(null);
            setEmail('');
            resetTurnstile();
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setIsSubmitting(true);
        setStatusMessage(null);

        try {
            const response = await fetch('/api/developer-keys', {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify({
                    email,
                    turnstile_token: isLocalDevelopment
                        ? 'local-development-bypass'
                        : turnstileToken,
                }),
            });

            const payload = (await response.json()) as
                | DeveloperKeySuccess
                | {
                      errors?: ValidationErrors;
                      login_url?: string;
                      message?: string;
                  };

            if (response.status === 422) {
                if ('errors' in payload && payload.errors !== undefined) {
                    setErrors(mapValidationErrors(payload.errors));
                } else {
                    setErrors({
                        turnstile_token:
                            payload.message ?? 'Turnstile verification failed.',
                    });
                }

                resetTurnstile();

                return;
            }

            if (response.status === 409) {
                setErrors({
                    email:
                        payload.message ??
                        'That email already has an account. Sign in instead.',
                });
                resetTurnstile();

                return;
            }

            if (!response.ok) {
                setErrors({
                    email: 'Unable to create a developer key right now.',
                });
                resetTurnstile();

                return;
            }

            setSuccess(payload as DeveloperKeySuccess);
            setErrors({});
            setStatusMessage((payload as DeveloperKeySuccess).message);
            setEmail('');
            resetTurnstile();
        } finally {
            setIsSubmitting(false);
        }
    };

    const sdkSnippet =
        success === null
            ? ''
            : `npm install @poofmq/node\n\nimport { PoofmqClient } from "@poofmq/node";\n\nconst client = new PoofmqClient({\n  baseUrl: process.env.POOFMQ_BASE_URL!,\n  apiKey: "${success.plain_text_key}",\n});\n\nconst result = await client.push("my-queue-id", "user.created", { user_id: "123" });\nconsole.log(result.messageId);`;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-xl">
                {success === null ? (
                    <>
                        <DialogHeader className="pb-4">
                            <DialogTitle>Get Your Free Dev Key</DialogTitle>
                            <DialogDescription>
                                Verify once, get a reusable key, and start using
                                the SDK immediately.
                            </DialogDescription>
                        </DialogHeader>

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="developer_key_email"
                                    className="text-sm font-medium"
                                >
                                    Email
                                </Label>
                                <Input
                                    id="developer_key_email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    placeholder="you@example.com"
                                    required
                                    type="email"
                                />
                                <InputError message={errors.email} />
                            </div>

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
                                            Turnstile site key is not
                                            configured.
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

                            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                                <Button
                                    type="submit"
                                    disabled={
                                        isSubmitting ||
                                        (!isLocalDevelopment &&
                                            turnstileToken.length === 0) ||
                                        siteKey === null
                                    }
                                    variant="default"
                                    size="lg"
                                    className="flex-1"
                                >
                                    {isSubmitting
                                        ? 'Verifying...'
                                        : 'Verify & Get Key'}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    asChild
                                    className="flex-1"
                                >
                                    <Link href={login()}>Sign In</Link>
                                </Button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <DialogHeader className="pb-6">
                            <div className="flex items-center gap-3">
                                <Badge>Ready</Badge>
                                <DialogTitle className="text-xl">
                                    Your key is ready
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-base">
                                Copy it now. This is the only time the full key
                                is shown.
                            </DialogDescription>
                        </DialogHeader>

                        {statusMessage !== null && (
                            <Alert variant="success">
                                <AlertDescription>
                                    {statusMessage}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                                PROJECT
                            </p>
                            <div className="rounded-lg border border-border bg-muted px-4 py-3 text-lg font-semibold">
                                {success.project_name}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                                API KEY
                            </p>
                            <div className="rounded-lg border border-primary/20 bg-muted px-4 py-3 font-mono text-sm break-all">
                                {success.plain_text_key}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    void copyToClipboard(
                                        success.plain_text_key,
                                    );
                                }}
                                className="h-11 w-full"
                            >
                                {copiedKey ? 'Copied key' : 'Copy key'}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                                FIRST SDK SNIPPET
                            </p>
                            <pre className="code-block">
                                <code>{sdkSnippet}</code>
                            </pre>
                        </div>

                        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                            <Button
                                type="button"
                                onClick={() => {
                                    void copyToClipboard(sdkSnippet);
                                }}
                                className="h-12 flex-1 text-base"
                            >
                                Copy snippet
                            </Button>

                            <a
                                href={success.claim_url}
                                className="inline-flex h-12 flex-1 items-center justify-center rounded-lg border border-border bg-background px-6 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted"
                            >
                                Set password
                            </a>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
