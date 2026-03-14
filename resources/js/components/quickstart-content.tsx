import {
    ArrowRightLeft,
    ArrowUpRight,
    Check,
    Code2,
    Copy,
    FileCode,
    Gauge,
    KeyRound,
    Lock,
    MessageSquareWarning,
    Rocket,
    ShieldCheck,
    TerminalSquare,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';

const REPOSITORY_URL = 'https://github.com/rubybear-lgtm/poofmq';
const SDK_READMES = {
    node: `${REPOSITORY_URL}/blob/main/sdks/node/README.md`,
    python: `${REPOSITORY_URL}/blob/main/sdks/python/README.md`,
} as const;

const PRODUCTION_API_BASE_URL = 'https://go-api-production-ac36.up.railway.app';
const SDK_LANGUAGE_STORAGE_KEY = 'poofmq-sdk-language';

type SdkLanguage = 'node' | 'python';
type CodeLanguage = 'shell' | 'javascript' | 'python' | 'plain';
type HighlightTokenType =
    | 'comment'
    | 'command'
    | 'function'
    | 'identifier'
    | 'keyword'
    | 'number'
    | 'operator'
    | 'property'
    | 'punctuation'
    | 'string'
    | 'variable'
    | 'plain';

type SdkGuideSection = {
    id: string;
    title: string;
    body: string[];
    icon: LucideIcon;
    details?: string[];
    snippets?: Record<SdkLanguage, string>;
};

const envExample = `export POOFMQ_BASE_URL="${PRODUCTION_API_BASE_URL}"
export POOFMQ_QUEUE_ID="your-queue-id"
export POOFMQ_API_KEY="your-dev-key"`;

const pushExample = String.raw`curl -X POST "$POOFMQ_BASE_URL/v1/queues/$POOFMQ_QUEUE_ID/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "envelope": {
      "event_type": "demo.message",
      "payload": {
        "text": "hello from poofmq"
      }
    },
    "ttl_seconds": 300
  }'`;

const popExample = String.raw`curl -X POST "$POOFMQ_BASE_URL/v1/queues/$POOFMQ_QUEUE_ID/messages:pop" \
  -H "Content-Type: application/json" \
  -d '{}'`;

const authExample = String.raw`curl -X POST "$POOFMQ_BASE_URL/v1/queues/$POOFMQ_QUEUE_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $POOFMQ_API_KEY" \
  -d '{ "...": "..." }'`;

const sdkGuides: SdkGuideSection[] = [
    {
        id: 'quickstart',
        title: 'Quickstart',
        icon: Rocket,
        body: [
            'Install the SDK, create a client, then push and pop one message.',
            'The language toggle changes every code sample on this page while keeping the behavior and guidance consistent.',
        ],
        snippets: {
            node: `npm install @poofmq/node

import { PoofmqClient } from '@poofmq/node';

const client = new PoofmqClient({
  baseUrl: process.env.POOFMQ_BASE_URL!,
  apiKey: process.env.POOFMQ_API_KEY,
});

await client.push('your-queue-id', 'demo.message', {
  text: 'hello from node',
});

const message = await client.pop('your-queue-id');`,
            python: `pip install poofmq

from poofmq import PoofmqClient
import os

client = PoofmqClient(
    base_url=os.environ["POOFMQ_BASE_URL"],
    api_key=os.getenv("POOFMQ_API_KEY"),
)

client.push(
    queue_id="your-queue-id",
    event_type="demo.message",
    payload={"text": "hello from python"},
)

message = client.pop("your-queue-id")`,
        },
    },
    {
        id: 'authentication',
        title: 'Authentication',
        icon: KeyRound,
        body: [
            'Queues created from the instant queue flow do not require a key. Use an API key when you want reusable access across projects and environments.',
            'Both SDKs accept a raw key or a Bearer token string and send the Authorization header for you.',
        ],
        snippets: {
            node: `const client = new PoofmqClient({
  baseUrl: process.env.POOFMQ_BASE_URL!,
  apiKey: process.env.POOFMQ_API_KEY, // optional
});`,
            python: `client = PoofmqClient(
    base_url=os.environ["POOFMQ_BASE_URL"],
    api_key=os.getenv("POOFMQ_API_KEY"),  # optional
)`,
        },
    },
    {
        id: 'push',
        title: 'Push Messages',
        icon: ArrowRightLeft,
        body: [
            'Push requires a queue ID, an event type, and a payload object. Optional delivery controls stay aligned across both SDKs.',
        ],
        details: [
            'Optional fields: TTL, available-at timestamp, idempotency key',
            'Queue operation: POST /v1/queues/{queue_id}/messages',
        ],
        snippets: {
            node: `await client.push(
  'your-queue-id',
  'order.created',
  { orderId: 'ord_123', total: 42 },
  {
    ttlSeconds: 300,
    idempotencyKey: 'order-created-ord_123',
  },
);`,
            python: `client.push(
    queue_id="your-queue-id",
    event_type="order.created",
    payload={"orderId": "ord_123", "total": 42},
    ttl_seconds=300,
    idempotency_key="order-created-ord_123",
)`,
        },
    },
    {
        id: 'pop',
        title: 'Pop Messages',
        icon: TerminalSquare,
        body: [
            'Pop returns the next visible message or an empty value when the queue has nothing available. An empty queue is normal control flow, not an exception.',
        ],
        details: [
            'Optional fields: visibility timeout, wait timeout, consumer ID',
            'Queue operation: POST /v1/queues/{queue_id}/messages:pop',
        ],
        snippets: {
            node: `const message = await client.pop('your-queue-id', {
  visibilityTimeoutSeconds: 30,
  waitTimeoutSeconds: 5,
  consumerId: 'worker-1',
});

if (message === null) {
  console.log('queue empty');
}`,
            python: `message = client.pop(
    "your-queue-id",
    visibility_timeout_seconds=30,
    wait_timeout_seconds=5,
    consumer_id="worker-1",
)

if message is None:
    print("queue empty")`,
        },
    },
    {
        id: 'encryption',
        title: 'Client-side Encryption',
        icon: Lock,
        body: [
            'Both SDKs support client-side AES-GCM encryption for zero-knowledge payload storage. The event type and delivery semantics remain visible; the payload body is encrypted before it leaves the client.',
            'Store the secret outside source control and use the matching decrypt helper when reading an encrypted payload.',
        ],
        snippets: {
            node: `const response = await client.push(
  'your-queue-id',
  'billing.charge.created',
  { amount: 99, currency: 'USD' },
  {
    encrypt: true,
    encryptionKey: process.env.POOFMQ_ENCRYPTION_KEY!,
  },
);`,
            python: `response = client.push(
    queue_id="your-queue-id",
    event_type="billing.charge.created",
    payload={"amount": 99, "currency": "USD"},
    encrypt=True,
    encryption_key=os.environ["POOFMQ_ENCRYPTION_KEY"],
)`,
        },
    },
    {
        id: 'errors',
        title: 'Error Handling',
        icon: MessageSquareWarning,
        body: [
            'Treat network failures, authentication failures, and validation failures as exceptions from the underlying generated client. A null or None response from pop means the queue is empty.',
            'For production code, log request context that helps you replay the failed push or pop without logging secret material.',
        ],
        snippets: {
            node: `try {
  await client.push('your-queue-id', 'demo.message', { text: 'hello' });
} catch (error) {
  console.error('poofmq request failed', error);
}`,
            python: `try:
    client.push("your-queue-id", "demo.message", {"text": "hello"})
except Exception as error:
    print(f"poofmq request failed: {error}")`,
        },
    },
    {
        id: 'api-reference',
        title: 'API Reference',
        icon: Code2,
        body: [
            'The public SDK API is intentionally smaller than the raw generated client. Use the wrapper for normal queue work and drop lower only if you need generated transport types directly.',
        ],
        snippets: {
            node: `new PoofmqClient({ baseUrl, apiKey? })
client.push(queueId, eventType, payload, options?)
client.pop(queueId, options?)
encryptPayload(payload, secret)
decryptPayload(encryptedPayload, iv, authTag, secret)`,
            python: `PoofmqClient(base_url, api_key=None)
client.push(queue_id, event_type, payload, **options)
client.pop(queue_id, **options)
encrypt_payload(payload, secret)
decrypt_payload(encrypted_payload, iv, auth_tag, secret)`,
        },
    },
    {
        id: 'compatibility',
        title: 'Compatibility',
        icon: ShieldCheck,
        body: [
            'The SDKs are generated from the published OpenAPI artifact at dist/openapi/v1/poofmq.json and follow the API version in config/openapi-version.txt.',
            'Current platform targets: Node 18+ for the Node SDK and Python 3.9+ for the Python SDK.',
        ],
    },
];

function getInitialLanguage(): SdkLanguage {
    if (typeof window === 'undefined') {
        return 'node';
    }

    const storedLanguage = window.localStorage.getItem(
        SDK_LANGUAGE_STORAGE_KEY,
    );

    return storedLanguage === 'python' ? 'python' : 'node';
}

export function QuickstartContent({
    startHref,
    quickstartHref,
    showQuickstartLink = true,
}: {
    quickstartHref: string;
    startHref: string;
    showQuickstartLink?: boolean;
}) {
    const [sdkLanguage, setSdkLanguage] =
        useState<SdkLanguage>(getInitialLanguage);

    useEffect(() => {
        window.localStorage.setItem(SDK_LANGUAGE_STORAGE_KEY, sdkLanguage);
    }, [sdkLanguage]);

    const selectedReadme = SDK_READMES[sdkLanguage];
    const selectedLanguageLabel = sdkLanguage === 'node' ? 'Node' : 'Python';

    return (
        <section className="mt-6 grid gap-6 xl:mt-8 xl:grid-cols-[20rem_minmax(0,1fr)]">
            <aside className="order-2 xl:sticky xl:top-8 xl:order-1 xl:self-start">
                <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-soft">
                    <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
                        <h2 className="text-sm font-semibold tracking-tight">
                            On this page
                        </h2>
                        <nav
                            className="mt-3 flex flex-wrap gap-2 xl:block xl:space-y-1.5"
                            aria-label="Quickstart sections"
                        >
                            <a
                                href="#http-quickstart"
                                className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground xl:flex xl:rounded-none xl:border-0 xl:bg-transparent xl:px-0 xl:py-0"
                            >
                                HTTP Quickstart
                            </a>
                            <a
                                href="#sdk-guide"
                                className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground xl:flex xl:rounded-none xl:border-0 xl:bg-transparent xl:px-0 xl:py-0"
                            >
                                SDK Guide
                            </a>
                        </nav>
                    </div>

                    <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
                        <a
                            href={startHref}
                            className="inline-flex w-full items-center justify-between gap-2 text-sm font-medium text-primary hover:text-primary/80"
                        >
                            Open start flow
                            <ArrowUpRight className="size-4" />
                        </a>

                        <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
                            <div className="flex items-start gap-3">
                                <Gauge className="mt-0.5 size-5 shrink-0 text-primary" />
                                <div>
                                    <p className="font-medium text-foreground">
                                        Shared SDK guide
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Switch between Node and Python while
                                        keeping the same request flow and method
                                        coverage.
                                    </p>
                                </div>
                            </div>
                            <a
                                href={selectedReadme}
                                rel="noreferrer"
                                target="_blank"
                                className="inline-flex w-full items-center justify-between gap-2 text-sm font-medium text-primary hover:text-primary/80"
                            >
                                Open {selectedLanguageLabel} README
                                <ArrowUpRight className="size-4" />
                            </a>
                        </div>

                        {showQuickstartLink && (
                            <a
                                href={quickstartHref}
                                className="inline-flex w-full items-center justify-between gap-2 text-sm font-medium text-primary hover:text-primary/80"
                                data-testid="quickstart-link"
                            >
                                Open direct quickstart link
                                <ArrowUpRight className="size-4" />
                            </a>
                        )}
                    </div>
                </div>
            </aside>

            <div className="order-1 min-w-0 space-y-6 xl:order-2">
                <section
                    id="http-quickstart"
                    className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-soft"
                >
                    <div className="border-b border-border px-5 py-5 sm:px-6 md:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground">
                                    HTTP QUICKSTART
                                </p>
                                <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                                    Preview the queue workflow over plain HTTP.
                                </h2>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
                                    Set the base URL and queue identifiers, then
                                    send and receive a message with cURL. The
                                    SDK examples below follow the same sequence.
                                    This remains public as a technical preview
                                    while the main product narrative focuses on
                                    community funding.
                                </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoChip
                                    icon={ArrowRightLeft}
                                    title="Push + pop"
                                    body="Send one message and read one message back with the minimum request set."
                                />
                                <InfoChip
                                    icon={KeyRound}
                                    title="Optional auth"
                                    body="Instant queues work without a key. Reusable environments should use an API key."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 px-5 py-5 sm:px-6 md:px-8 md:py-8">
                        <CodeBlock
                            code={envExample}
                            label="Environment"
                            language="shell"
                            tone="hero"
                        />

                        <InfoPanel
                            icon={KeyRound}
                            title="Auth Header"
                            body="Optional for instant queues. Recommended whenever you are using a reusable dev key."
                        />

                        <div className="grid gap-4 xl:grid-cols-2">
                            <CodeBlock
                                code={pushExample}
                                label="Push a Message"
                                language="shell"
                            />
                            <CodeBlock
                                code={popExample}
                                label="Pop a Message"
                                language="shell"
                            />
                        </div>

                        <CodeBlock
                            code={authExample}
                            label="Authenticated Request"
                            language="shell"
                        />
                    </div>
                </section>

                <SdkGuidePanel
                    language={sdkLanguage}
                    onLanguageChange={setSdkLanguage}
                />
            </div>
        </section>
    );
}

function SdkGuidePanel({
    language,
    onLanguageChange,
}: {
    language: SdkLanguage;
    onLanguageChange: (language: SdkLanguage) => void;
}) {
    return (
        <section
            id="sdk-guide"
            className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-soft"
        >
            <div className="flex flex-col gap-6">
                <div className="border-b border-border px-5 py-5 sm:px-6 md:px-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground">
                                SDK Guide
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                                SDK examples for both supported languages.
                            </h2>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                                Choose Node or Python once. Every install
                                command, client example, and method example
                                below updates to match that selection.
                            </p>
                        </div>
                        <div
                            className="inline-flex w-full rounded-xl border border-border bg-muted/70 p-1 sm:w-auto"
                            role="tablist"
                            aria-label="SDK language"
                        >
                            <LanguageToggleButton
                                icon={Code2}
                                isActive={language === 'node'}
                                label="Node"
                                onClick={() => onLanguageChange('node')}
                            />
                            <LanguageToggleButton
                                icon={FileCode}
                                isActive={language === 'python'}
                                label="Python"
                                onClick={() => onLanguageChange('python')}
                            />
                        </div>
                    </div>
                </div>
                <div className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6 md:px-8 md:pb-8">
                    {sdkGuides.map((section, index) => (
                        <SdkGuideSectionCard
                            key={section.id}
                            index={index}
                            language={language}
                            section={section}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function LanguageToggleButton({
    icon: Icon,
    isActive,
    label,
    onClick,
}: {
    icon: LucideIcon;
    isActive: boolean;
    label: string;
    onClick: () => void;
}) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
                'min-w-0 flex-1 gap-1.5 rounded-lg px-4 sm:min-w-24 sm:flex-none',
                isActive
                    ? 'bg-card text-foreground shadow-sm hover:bg-card'
                    : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={onClick}
        >
            <Icon className="size-4" />
            {label}
        </Button>
    );
}

function SdkGuideSectionCard({
    index,
    language,
    section,
}: {
    index: number;
    language: SdkLanguage;
    section: SdkGuideSection;
}) {
    const snippet = section.snippets?.[language];

    return (
        <article className="rounded-[1.5rem] border border-border bg-[linear-gradient(to_bottom,theme(colors.card),theme(colors.muted/20))] p-5 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <section.icon className="size-5" />
                </div>
                <div className="w-full">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground">
                                STEP {String(index + 1).padStart(2, '0')}
                            </p>
                            <h3 className="mt-1 text-xl font-semibold tracking-tight">
                                {section.title}
                            </h3>
                        </div>
                    </div>
                    <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                        {section.body.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                    </div>
                    {section.details ? (
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            {section.details.map((detail) => (
                                <DetailPill key={detail} detail={detail} />
                            ))}
                        </div>
                    ) : null}
                    {snippet ? (
                        <div className="mt-4">
                            <CodeBlock
                                code={snippet}
                                label={`${section.title} - ${language === 'node' ? 'Node' : 'Python'}`}
                                language={
                                    language === 'node'
                                        ? 'javascript'
                                        : 'python'
                                }
                            />
                        </div>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

function DetailPill({ detail }: { detail: string }) {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-background/80 p-3">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
    );
}

function CodeBlock({
    code,
    label,
    language = 'plain',
    tone = 'default',
}: {
    code: string;
    label: string;
    language?: CodeLanguage;
    tone?: 'default' | 'hero';
}) {
    const [copiedText, copyToClipboard] = useClipboard();
    const isCopied = copiedText === code;
    const highlightedLines = highlightCode(code, language);

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground">
                    {label}
                </p>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                        void copyToClipboard(code);
                    }}
                >
                    {isCopied ? (
                        <Check className="size-3.5" />
                    ) : (
                        <Copy className="size-3.5" />
                    )}
                    {isCopied ? 'Copied' : 'Copy'}
                </Button>
            </div>
            <pre
                className={cn(
                    'max-w-full overflow-x-auto rounded-2xl border p-4 font-mono text-[11px] leading-6 sm:p-5 sm:text-sm sm:leading-7',
                    tone === 'hero'
                        ? 'border-primary/15 bg-[linear-gradient(180deg,theme(colors.muted),theme(colors.background))]'
                        : 'border-border bg-muted/70',
                )}
            >
                <code className="block min-w-max sm:min-w-max">
                    {highlightedLines.map((line, index) => (
                        <div
                            key={`${label}-${index}`}
                            className="min-h-[1.75rem]"
                        >
                            {line.length === 0 ? (
                                <span>&nbsp;</span>
                            ) : (
                                line.map((token, tokenIndex) => (
                                    <span
                                        key={`${label}-${index}-${tokenIndex}`}
                                        className={tokenClassName(token.type)}
                                    >
                                        {token.value}
                                    </span>
                                ))
                            )}
                        </div>
                    ))}
                </code>
            </pre>
        </div>
    );
}

function InfoPanel({
    body,
    icon: Icon,
    title,
}: {
    body: string;
    icon: LucideIcon;
    title: string;
}) {
    return (
        <div className="rounded-2xl border border-border bg-background/75 p-5">
            <div className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                    <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground">
                        {title}
                    </p>
                    <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">
                        {body}
                    </p>
                </div>
            </div>
        </div>
    );
}

function InfoChip({
    body,
    icon: Icon,
    title,
}: {
    body: string;
    icon: LucideIcon;
    title: string;
}) {
    return (
        <div className="rounded-2xl border border-border bg-background/80 p-4">
            <div className="flex items-start gap-3">
                <Icon className="mt-0.5 size-4.5 shrink-0 text-primary" />
                <div>
                    <p className="font-medium text-foreground">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {body}
                    </p>
                </div>
            </div>
        </div>
    );
}

function highlightCode(
    code: string,
    language: CodeLanguage,
): Array<Array<{ type: HighlightTokenType; value: string }>> {
    return code.split('\n').map((line) => tokenizeLine(line, language));
}

function tokenizeLine(
    line: string,
    language: CodeLanguage,
): Array<{ type: HighlightTokenType; value: string }> {
    if (line.length === 0) {
        return [];
    }

    if (language === 'shell') {
        return tokenizeShellLine(line);
    }

    if (language === 'javascript') {
        return tokenizeJavaScriptLine(line);
    }

    if (language === 'python') {
        return tokenizePythonLine(line);
    }

    return [{ type: 'plain', value: line }];
}

function tokenizeShellLine(
    line: string,
): Array<{ type: HighlightTokenType; value: string }> {
    const tokens: Array<{ type: HighlightTokenType; value: string }> = [];
    const pattern =
        /(\$[A-Z0-9_]+|\$\{?[A-Z0-9_]+\}?|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:curl|export|npm|pip|import|from)\b|-{1,2}[a-zA-Z-]+|\b\d+(?:\.\d+)?\b|[{}[\]():,.\\])/g;

    let cursor = 0;

    for (const match of line.matchAll(pattern)) {
        const value = match[0];
        const start = match.index ?? 0;

        if (start > cursor) {
            tokens.push({ type: 'plain', value: line.slice(cursor, start) });
        }

        let type: HighlightTokenType = 'plain';

        if (value.startsWith('$')) {
            type = 'variable';
        } else if (value.startsWith('"') || value.startsWith("'")) {
            type = 'string';
        } else if (
            ['curl', 'export', 'npm', 'pip', 'import', 'from'].includes(value)
        ) {
            type =
                value === 'curl' || value === 'npm' || value === 'pip'
                    ? 'command'
                    : 'keyword';
        } else if (value.startsWith('-')) {
            type = 'operator';
        } else if (/^\d/.test(value)) {
            type = 'number';
        } else if (/^[{}[\]():,.\\]$/.test(value)) {
            type = 'punctuation';
        }

        tokens.push({ type, value });
        cursor = start + value.length;
    }

    if (cursor < line.length) {
        tokens.push({ type: 'plain', value: line.slice(cursor) });
    }

    return tokens;
}

function tokenizeJavaScriptLine(
    line: string,
): Array<{ type: HighlightTokenType; value: string }> {
    const tokens: Array<{ type: HighlightTokenType; value: string }> = [];
    const pattern =
        /(\/\/.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:import|from|const|new|await|if|null|try|catch|console|true|false)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*(?=\()|(?<=\.)[A-Za-z_$][\w$]*|process\.env\.[A-Z0-9_]+|[{}[\]();,.])/gm;

    let cursor = 0;

    for (const match of line.matchAll(pattern)) {
        const value = match[0];
        const start = match.index ?? 0;

        if (start > cursor) {
            tokens.push({ type: 'plain', value: line.slice(cursor, start) });
        }

        let type: HighlightTokenType = 'plain';

        if (value.startsWith('//')) {
            type = 'comment';
        } else if (
            value.startsWith('"') ||
            value.startsWith("'") ||
            value.startsWith('`')
        ) {
            type = 'string';
        } else if (
            [
                'import',
                'from',
                'const',
                'new',
                'await',
                'if',
                'null',
                'try',
                'catch',
                'true',
                'false',
            ].includes(value)
        ) {
            type = 'keyword';
        } else if (value === 'console') {
            type = 'identifier';
        } else if (value.startsWith('process.env.')) {
            type = 'variable';
        } else if (/^\d/.test(value)) {
            type = 'number';
        } else if (/^[{}[\]();,.]$/.test(value)) {
            type = 'punctuation';
        } else if (/^[A-Za-z_$][\w$]*$/.test(value)) {
            type =
                line.slice(start - 1, start) === '.' ? 'property' : 'function';
        }

        tokens.push({ type, value });
        cursor = start + value.length;
    }

    if (cursor < line.length) {
        tokens.push({ type: 'plain', value: line.slice(cursor) });
    }

    return tokens;
}

function tokenizePythonLine(
    line: string,
): Array<{ type: HighlightTokenType; value: string }> {
    const tokens: Array<{ type: HighlightTokenType; value: string }> = [];
    const pattern =
        /(#.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:from|import|try|except|if|is|None|True|False)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_][\w]*(?=\()|(?<=\.)[A-Za-z_][\w]*|[A-Z][A-Za-z0-9_]*|[{}[\]():,.])/gm;

    let cursor = 0;

    for (const match of line.matchAll(pattern)) {
        const value = match[0];
        const start = match.index ?? 0;

        if (start > cursor) {
            tokens.push({ type: 'plain', value: line.slice(cursor, start) });
        }

        let type: HighlightTokenType = 'plain';

        if (value.startsWith('#')) {
            type = 'comment';
        } else if (value.startsWith('"') || value.startsWith("'")) {
            type = 'string';
        } else if (
            [
                'from',
                'import',
                'try',
                'except',
                'if',
                'is',
                'None',
                'True',
                'False',
            ].includes(value)
        ) {
            type = 'keyword';
        } else if (/^\d/.test(value)) {
            type = 'number';
        } else if (/^[{}[\]():,.]$/.test(value)) {
            type = 'punctuation';
        } else if (/^[A-Z][A-Za-z0-9_]*$/.test(value)) {
            type = 'identifier';
        } else if (/^[A-Za-z_][\w]*$/.test(value)) {
            type =
                line.slice(start - 1, start) === '.' ? 'property' : 'function';
        }

        tokens.push({ type, value });
        cursor = start + value.length;
    }

    if (cursor < line.length) {
        tokens.push({ type: 'plain', value: line.slice(cursor) });
    }

    return tokens;
}

function tokenClassName(type: HighlightTokenType): string {
    switch (type) {
        case 'comment':
            return 'text-muted-foreground/80 italic';
        case 'command':
            return 'font-semibold text-primary';
        case 'function':
            return 'text-sky-700 dark:text-sky-300';
        case 'identifier':
            return 'text-violet-700 dark:text-violet-300';
        case 'keyword':
            return 'font-medium text-rose-700 dark:text-rose-300';
        case 'number':
            return 'text-emerald-700 dark:text-emerald-300';
        case 'operator':
            return 'text-foreground';
        case 'property':
            return 'text-amber-700 dark:text-amber-300';
        case 'punctuation':
            return 'text-muted-foreground';
        case 'string':
            return 'text-emerald-700 dark:text-emerald-300';
        case 'variable':
            return 'text-cyan-700 dark:text-cyan-300';
        default:
            return 'text-foreground';
    }
}
