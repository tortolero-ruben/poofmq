import { useEffect, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';

type LiveDemoMessage = {
    id: string;
    text: string;
    created_at: string;
};

const STORAGE_KEY = 'poofmq-live-demo-messages';
const VISIBLE_LIMIT = 8;
const ACTION_DELAY_MS = 120;

export default function LiveDemoPanel() {
    const [demoMessage, setDemoMessage] = useState('hello from poofmq');
    const [messages, setMessages] = useState<LiveDemoMessage[]>([]);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPushing, setIsPushing] = useState(false);
    const [isPopping, setIsPopping] = useState(false);
    const depth = messages.length;

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const storedMessages = window.localStorage.getItem(STORAGE_KEY);

            if (storedMessages === null) {
                return;
            }

            const parsedMessages = JSON.parse(
                storedMessages,
            ) as LiveDemoMessage[];

            if (Array.isArray(parsedMessages)) {
                setMessages(parsedMessages);
            }
        } catch {
            setMessages([]);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    const liveCurlExample = useMemo(() => {
        const escapedMessage = demoMessage.replace(/"/g, '\\"');

        return `curl -X POST https://poofmq.com/api/v1/q/{queue_id}/messages \\
  -H "Content-Type: application/json" \\
  -d '{"envelope":{"event_type":"demo.message","payload":{"text":"${escapedMessage}"}}}'`;
    }, [demoMessage]);

    const handlePush = async (): Promise<void> => {
        setIsPushing(true);
        setStatus(null);
        setError(null);

        try {
            const nextMessage = demoMessage.trim();

            if (nextMessage.length === 0) {
                setError('Enter a message to push onto the queue.');
                return;
            }

            await new Promise((resolve) =>
                window.setTimeout(resolve, ACTION_DELAY_MS),
            );

            setMessages((currentMessages) => [
                ...currentMessages.slice(-1 * (VISIBLE_LIMIT - 1)),
                {
                    id:
                        typeof crypto !== 'undefined' &&
                        typeof crypto.randomUUID === 'function'
                            ? crypto.randomUUID()
                            : `${Date.now()}`,
                    text: nextMessage,
                    created_at: new Date().toISOString(),
                },
            ]);
            setStatus('MESSAGE_PUSHED');
            setDemoMessage('');
        } catch {
            setError('Unable to push the live demo message.');
        } finally {
            setIsPushing(false);
        }
    };

    const handlePop = async (): Promise<void> => {
        setIsPopping(true);
        setStatus(null);
        setError(null);

        try {
            await new Promise((resolve) =>
                window.setTimeout(resolve, ACTION_DELAY_MS),
            );

            let poppedMessage = false;

            setMessages((currentMessages) => {
                if (currentMessages.length === 0) {
                    return currentMessages;
                }

                poppedMessage = true;

                return currentMessages.slice(1);
            });

            setStatus(poppedMessage ? 'MESSAGE_POPPED' : 'QUEUE_ALREADY_EMPTY');
        } catch {
            setError('Unable to pop the live demo message.');
        } finally {
            setIsPopping(false);
        }
    };

    return (
        <div className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-8">
            <div className="mb-6 inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                Live Example
            </div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Push it. Pop it.
                </h2>
                <div className="rounded-lg border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                    Live depth: {depth}
                </div>
            </div>
            <p className="mb-6 max-w-2xl text-sm text-muted-foreground sm:mb-8 sm:text-base">
                Push a message, watch it land, then pop the next one off the
                front. When you're ready, create a real queue.
            </p>

            <div className="mb-8 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div className="min-w-0 rounded-xl border border-border bg-muted/50 p-5 sm:p-6">
                    <label
                        htmlFor="live-demo-message"
                        className="mb-3 block text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                    >
                        Message payload
                    </label>
                    <textarea
                        id="live-demo-message"
                        value={demoMessage}
                        onChange={(event) => setDemoMessage(event.target.value)}
                        maxLength={160}
                        rows={4}
                        className="mb-4 w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        placeholder="hello from poofmq"
                    />
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <Button
                            type="button"
                            onClick={handlePush}
                            disabled={
                                isPushing ||
                                isPopping ||
                                demoMessage.trim().length === 0
                            }
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                        >
                            {isPushing ? 'Pushing...' : 'Push'}
                        </Button>
                        <Button
                            type="button"
                            onClick={handlePop}
                            disabled={isPopping || isPushing}
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            {isPopping ? 'Popping...' : 'Pop'}
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>Instant example</span>
                        <span className="text-border">|</span>
                        <span>Max 160 chars</span>
                        <span className="text-border">|</span>
                        <span>Push/Pop flow</span>
                    </div>
                    <InputError message={error ?? undefined} />
                    {status !== null ? (
                        <p className="mt-3 text-xs font-medium text-primary">
                            {status}
                        </p>
                    ) : null}
                </div>

                <div className="min-w-0 rounded-xl border border-border bg-muted/30 p-5 sm:p-6">
                    <p className="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Live queue
                    </p>
                    <div className="space-y-3">
                        {messages.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
                                Queue empty
                            </div>
                        ) : (
                            messages.map((message, index) => (
                                <div
                                    key={message.id}
                                    className="rounded-lg border border-border bg-background px-4 py-3"
                                >
                                    <div className="mb-2 flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
                                        <span>
                                            Slot{' '}
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <span
                                            className={
                                                index === 0
                                                    ? 'text-primary'
                                                    : ''
                                            }
                                        >
                                            {index === 0 ? 'Head' : 'Waiting'}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium break-words">
                                        {message.text}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-full overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 font-mono text-xs sm:text-sm">
                <p className="mb-2 text-muted-foreground">
                    # Real queue API example
                </p>
                <pre className="max-w-full break-all whitespace-pre-wrap">
                    {liveCurlExample}
                </pre>
            </div>
        </div>
    );
}
