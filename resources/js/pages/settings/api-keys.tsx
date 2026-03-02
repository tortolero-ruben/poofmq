import { Head, Link } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClipboard } from '@/hooks/use-clipboard';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { jsonHeaders } from '@/lib/utils';
import {
    destroy as destroyApiKey,
    index as apiKeysIndex,
    store as storeApiKey,
} from '@/routes/api-keys';
import { index as projectsIndex } from '@/routes/projects';
import type { BreadcrumbItem } from '@/types';

type ProjectOption = {
    id: string;
    name: string;
};

type ApiKeyRecord = {
    id: string;
    name: string;
    key_prefix: string;
    project_id: string | null;
    project_name: string | null;
    expires_at: string | null;
    revoked_at: string | null;
    revoked_by: number | null;
    created_at: string;
    is_valid: boolean;
};

type ValidationErrors = Record<string, string[]>;

type Props = {
    apiKeys: ApiKeyRecord[];
    projects: ProjectOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'API keys',
        href: apiKeysIndex(),
    },
];

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

export default function ApiKeys({ apiKeys: initialApiKeys, projects }: Props) {
    const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>(initialApiKeys);
    const [name, setName] = useState<string>('');
    const [projectId, setProjectId] = useState<string>('');
    const [expiresAt, setExpiresAt] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [plainTextKey, setPlainTextKey] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
    const [copiedValue, copyToClipboard] = useClipboard();

    const copiedKey = useMemo(
        () => copiedValue !== null && copiedValue === plainTextKey,
        [copiedValue, plainTextKey],
    );

    const handleCreateApiKey = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setStatusMessage(null);
        setIsCreating(true);

        const expiresAtValue =
            expiresAt === '' ? null : new Date(expiresAt).toISOString();

        try {
            const response = await fetch(storeApiKey.url(), {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify({
                    name,
                    project_id: projectId || null,
                    expires_at: expiresAtValue,
                }),
            });

            const payload = await response.json();

            if (response.status === 422) {
                setErrors(
                    mapValidationErrors(
                        payload.errors as ValidationErrors | undefined,
                    ),
                );

                return;
            }

            if (!response.ok) {
                setErrors({ name: 'Unable to create the API key right now.' });

                return;
            }

            const createdApiKey = payload.api_key as ApiKeyRecord;

            setApiKeys((currentApiKeys) => [
                {
                    ...createdApiKey,
                    revoked_at: null,
                    revoked_by: null,
                    is_valid: true,
                },
                ...currentApiKeys,
            ]);
            setErrors({});
            setName('');
            setProjectId('');
            setExpiresAt('');
            setPlainTextKey(payload.plain_text_key as string);
            setStatusMessage(payload.message as string);
        } finally {
            setIsCreating(false);
        }
    };

    const handleRevokeApiKey = async (apiKeyId: string) => {
        setStatusMessage(null);
        setRevokingKeyId(apiKeyId);

        try {
            const response = await fetch(destroyApiKey.url(apiKeyId), {
                method: 'DELETE',
                headers: jsonHeaders(),
            });

            const payload = await response.json();

            if (!response.ok) {
                setStatusMessage('Unable to revoke the API key right now.');

                return;
            }

            setApiKeys((currentApiKeys) =>
                currentApiKeys.map((apiKey) =>
                    apiKey.id === apiKeyId
                        ? {
                              ...apiKey,
                              revoked_at:
                                  apiKey.revoked_at ?? new Date().toISOString(),
                              is_valid: false,
                          }
                        : apiKey,
                ),
            );
            setStatusMessage(payload.message as string);
        } finally {
            setRevokingKeyId(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="API keys" />

            <h1 className="sr-only">API keys</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="API keys"
                        description="Generate and revoke keys used by your projects to authenticate requests."
                    />

                    {statusMessage !== null && (
                        <p className="text-sm font-medium text-green-600">
                            {statusMessage}
                        </p>
                    )}

                    {plainTextKey !== null && (
                        <section className="space-y-3 rounded-xl border border-sidebar-border/70 bg-muted/20 p-4">
                            <Heading
                                variant="small"
                                title="Copy this key now"
                                description="For security, this plain text key is shown once and cannot be retrieved later."
                            />

                            <p className="rounded-md border bg-background px-3 py-2 font-mono text-sm break-all">
                                {plainTextKey}
                            </p>

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    void copyToClipboard(plainTextKey);
                                }}
                            >
                                {copiedKey ? 'Copied' : 'Copy key'}
                            </Button>
                        </section>
                    )}

                    <section className="space-y-4 rounded-xl border border-sidebar-border/70 p-4">
                        <Heading
                            variant="small"
                            title="Create API key"
                            description="Assign keys to projects to isolate usage and revoke access quickly."
                        />

                        <form
                            className="space-y-4"
                            onSubmit={handleCreateApiKey}
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="api_key_name">Name</Label>
                                <Input
                                    id="api_key_name"
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                    placeholder="Worker service key"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="api_key_project">Project</Label>
                                <select
                                    id="api_key_project"
                                    value={projectId}
                                    onChange={(event) =>
                                        setProjectId(event.target.value)
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    <option value="">No project</option>
                                    {projects.map((project) => (
                                        <option
                                            key={project.id}
                                            value={project.id}
                                        >
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.project_id} />
                                {projects.length === 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        No projects available.{' '}
                                        <Link
                                            className="underline"
                                            href={projectsIndex()}
                                        >
                                            Create a project first.
                                        </Link>
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="api_key_expires_at">
                                    Expires at (optional)
                                </Label>
                                <Input
                                    id="api_key_expires_at"
                                    type="datetime-local"
                                    value={expiresAt}
                                    onChange={(event) =>
                                        setExpiresAt(event.target.value)
                                    }
                                />
                                <InputError message={errors.expires_at} />
                            </div>

                            <Button type="submit" disabled={isCreating}>
                                {isCreating
                                    ? 'Generating...'
                                    : 'Generate API key'}
                            </Button>
                        </form>
                    </section>

                    <section className="space-y-4">
                        <Heading
                            variant="small"
                            title="Existing keys"
                            description="Revoke keys immediately if they are no longer needed."
                        />

                        {apiKeys.length === 0 && (
                            <div className="rounded-xl border border-dashed border-sidebar-border/70 p-6 text-sm text-muted-foreground">
                                No API keys yet.
                            </div>
                        )}

                        {apiKeys.map((apiKey) => (
                            <article
                                key={apiKey.id}
                                className="space-y-3 rounded-xl border border-sidebar-border/70 p-4"
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-medium">
                                        {apiKey.name}
                                    </h3>
                                    <Badge
                                        variant={
                                            apiKey.is_valid
                                                ? 'default'
                                                : 'destructive'
                                        }
                                    >
                                        {apiKey.is_valid ? 'Active' : 'Revoked'}
                                    </Badge>
                                    {apiKey.project_name !== null && (
                                        <Badge variant="outline">
                                            {apiKey.project_name}
                                        </Badge>
                                    )}
                                </div>

                                <dl className="grid gap-2 text-sm text-muted-foreground">
                                    <div>
                                        <dt className="font-medium text-foreground">
                                            Prefix
                                        </dt>
                                        <dd className="font-mono">
                                            {apiKey.key_prefix}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium text-foreground">
                                            Created
                                        </dt>
                                        <dd>
                                            {new Date(
                                                apiKey.created_at,
                                            ).toLocaleString()}
                                        </dd>
                                    </div>
                                    {apiKey.expires_at !== null && (
                                        <div>
                                            <dt className="font-medium text-foreground">
                                                Expires
                                            </dt>
                                            <dd>
                                                {new Date(
                                                    apiKey.expires_at,
                                                ).toLocaleString()}
                                            </dd>
                                        </div>
                                    )}
                                    {apiKey.revoked_at !== null && (
                                        <div>
                                            <dt className="font-medium text-foreground">
                                                Revoked
                                            </dt>
                                            <dd>
                                                {new Date(
                                                    apiKey.revoked_at,
                                                ).toLocaleString()}
                                            </dd>
                                        </div>
                                    )}
                                </dl>

                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={
                                        !apiKey.is_valid ||
                                        revokingKeyId === apiKey.id
                                    }
                                    onClick={() =>
                                        handleRevokeApiKey(apiKey.id)
                                    }
                                >
                                    {revokingKeyId === apiKey.id
                                        ? 'Revoking...'
                                        : 'Revoke key'}
                                </Button>
                            </article>
                        ))}
                    </section>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
