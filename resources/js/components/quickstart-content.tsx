import {
    ArrowRightLeft,
    BookOpen,
    Check,
    Code2,
    FileCode,
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

const REPOSITORY_URL = 'https://github.com/tortolero-ruben/poofmq';
const SDK_READMES = {
    node: `${REPOSITORY_URL}/blob/main/sdks/node/README.md`,
    python: `${REPOSITORY_URL}/blob/main/sdks/python/README.md`,
} as const;

const PRODUCTION_API_BASE_URL = 'https://go-api-production-ac36.up.railway.app';
const LOCAL_API_BASE_URL = 'http://localhost:8080';
const SDK_LANGUAGE_STORAGE_KEY = 'poofmq-sdk-language';

type SdkLanguage = 'node' | 'python';

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
            'Install the SDK, create a client, then push and pop one message. This is the shortest path from zero to a working queue consumer.',
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
            'Queues created from START INSTANTLY do not require a key. Use a developer key when you want reusable access across projects and environments.',
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
}: {
    quickstartHref: string;
    startHref: string;
}) {
    const [sdkLanguage, setSdkLanguage] =
        useState<SdkLanguage>(getInitialLanguage);

    useEffect(() => {
        window.localStorage.setItem(SDK_LANGUAGE_STORAGE_KEY, sdkLanguage);
    }, [sdkLanguage]);

    const selectedReadme = SDK_READMES[sdkLanguage];
    const selectedLanguageLabel = sdkLanguage === 'node' ? 'Node' : 'Python';

    return (
        <>
            <div className="mt-8 grid gap-4 xl:grid-cols-3">
                <section className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-start gap-4">
                        <Rocket className="mt-1 size-6 shrink-0 text-primary" />
                        <div>
                            <h2 className="text-lg font-bold">Start Paths</h2>
                            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                                <div className="border-l-2 border-primary pl-4">
                                    <p className="font-semibold text-foreground">
                                        Start Instantly
                                    </p>
                                    <p className="mt-1">
                                        Create a queue immediately, copy the
                                        queue ID, and start pushing messages.
                                    </p>
                                </div>
                                <div className="border-l-2 border-border pl-4">
                                    <p className="font-semibold text-foreground">
                                        Get Free Dev Key
                                    </p>
                                    <p className="mt-1">
                                        Use a reusable Bearer token for SDK
                                        work, projects, and key management.
                                    </p>
                                </div>
                                <a
                                    href={startHref}
                                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary/80"
                                >
                                    Open Start Flow
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
                <section
                    className="rounded-xl border border-border bg-card p-6"
                    data-testid="quickstart-link"
                >
                    <div className="flex items-start gap-4">
                        <BookOpen className="mt-1 size-6 shrink-0 text-primary" />
                        <div>
                            <h2 className="text-lg font-bold">
                                Quickstart URL
                            </h2>
                            <p className="mt-3 text-sm text-muted-foreground">
                                This page is also available directly at{' '}
                                <span className="font-mono text-foreground">
                                    /docs/quickstart
                                </span>
                                .
                            </p>
                            <a
                                href={quickstartHref}
                                className="mt-4 inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary/80"
                            >
                                Open Direct Link
                            </a>
                        </div>
                    </div>
                </section>
                <section className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-start gap-4">
                        <KeyRound className="mt-1 size-6 shrink-0 text-primary" />
                        <div>
                            <h2 className="text-lg font-bold">
                                Shared SDK Guide
                            </h2>
                            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                                <p>
                                    One guide, two languages. The behavior,
                                    concepts, and caveats stay shared while the
                                    examples switch between Node and Python.
                                </p>
                                <p>
                                    Current selection:{' '}
                                    <span className="font-semibold text-foreground">
                                        {selectedLanguageLabel}
                                    </span>
                                </p>
                                <a
                                    href={selectedReadme}
                                    rel="noreferrer"
                                    target="_blank"
                                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary/80"
                                >
                                    Open {selectedLanguageLabel} README
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            <section className="mt-8 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-start gap-4">
                        <TerminalSquare className="mt-1 size-6 shrink-0 text-primary" />
                        <div className="w-full">
                            <h2 className="text-lg font-bold">
                                HTTP Quickstart
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Start with raw HTTP if you want to prove the API
                                flow first. Then switch to the shared SDK guide
                                below for reusable application code.
                            </p>
                            <div className="mt-6 space-y-6">
                                <CodeBlock
                                    code={envExample}
                                    label="Environment"
                                />
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <InfoPanel
                                        icon={ArrowRightLeft}
                                        title="API Base URL"
                                        body={`Production: ${PRODUCTION_API_BASE_URL}\nLocal: ${LOCAL_API_BASE_URL}`}
                                    />
                                    <InfoPanel
                                        icon={KeyRound}
                                        title="Auth Header"
                                        body="Optional for instant queues. Recommended whenever you are using a reusable dev key."
                                    />
                                </div>
                                <CodeBlock
                                    code={pushExample}
                                    label="Push a Message"
                                />
                                <CodeBlock
                                    code={popExample}
                                    label="Pop a Message"
                                />
                                <CodeBlock
                                    code={authExample}
                                    label="Authenticated Request"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <SdkGuidePanel
                    language={sdkLanguage}
                    onLanguageChange={setSdkLanguage}
                />
            </section>
        </>
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
        <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-col gap-6">
                <div className="border-b border-border pb-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                SDK Guide
                            </p>
                            <h2 className="mt-2 text-xl font-bold">
                                Shared Documentation, Switched Examples
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                Pick a language once. Every install command,
                                constructor example, and method example below
                                stays in sync with that choice.
                            </p>
                        </div>
                        <div
                            className="inline-flex rounded-lg bg-muted p-1"
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
                <div className="space-y-4">
                    {sdkGuides.map((section) => (
                        <SdkGuideSectionCard
                            key={section.id}
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
                'min-w-24 gap-1.5',
                isActive
                    ? 'rounded-md bg-card text-foreground shadow-sm hover:bg-card'
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
    language,
    section,
}: {
    language: SdkLanguage;
    section: SdkGuideSection;
}) {
    const snippet = section.snippets?.[language];

    return (
        <article className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start gap-4">
                <section.icon className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="w-full">
                    <h3 className="font-bold">{section.title}</h3>
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
        <div className="flex items-start gap-3 rounded-lg bg-muted p-3">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
    );
}

function CodeBlock({ code, label }: { code: string; label: string }) {
    const [copiedText, copyToClipboard] = useClipboard();
    const isCopied = copiedText === code;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    {label}
                </p>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                        void copyToClipboard(code);
                    }}
                >
                    {isCopied ? 'Copied' : 'Copy'}
                </Button>
            </div>
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-sm">
                <code>{code}</code>
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
        <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
