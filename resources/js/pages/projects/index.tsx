import { Head } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { jsonHeaders } from '@/lib/utils';
import {
    destroy as destroyProject,
    index as projectsIndex,
    store as storeProject,
    update as updateProject,
} from '@/routes/projects';
import type { BreadcrumbItem } from '@/types';

type Project = {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
};

type EditableProject = {
    name: string;
    description: string;
};

type ValidationErrors = Record<string, string[]>;

type Props = {
    projects: Project[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Projects',
        href: projectsIndex(),
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

function editableProject(project: Project): EditableProject {
    return {
        name: project.name,
        description: project.description ?? '',
    };
}

export default function Projects({ projects: initialProjects }: Props) {
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [newProjectName, setNewProjectName] = useState<string>('');
    const [newProjectDescription, setNewProjectDescription] =
        useState<string>('');
    const [editingProjects, setEditingProjects] = useState<
        Record<string, EditableProject>
    >(
        Object.fromEntries(
            initialProjects.map((project) => [
                project.id,
                editableProject(project),
            ]),
        ),
    );
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [updateErrors, setUpdateErrors] = useState<
        Record<string, Record<string, string>>
    >({});
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [createProcessing, setCreateProcessing] = useState<boolean>(false);
    const [updatingProjectId, setUpdatingProjectId] = useState<string | null>(
        null,
    );
    const [archivingProjectId, setArchivingProjectId] = useState<string | null>(
        null,
    );

    const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setStatusMessage(null);
        setCreateProcessing(true);

        try {
            const response = await fetch(storeProject.url(), {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify({
                    name: newProjectName,
                    description: newProjectDescription || null,
                }),
            });

            const payload = await response.json();

            if (response.status === 422) {
                setCreateErrors(
                    mapValidationErrors(
                        payload.errors as ValidationErrors | undefined,
                    ),
                );

                return;
            }

            if (!response.ok) {
                setCreateErrors({
                    name: 'Unable to create the project right now.',
                });

                return;
            }

            const createdProject = payload.project as Project;

            setProjects((currentProjects) => [
                createdProject,
                ...currentProjects,
            ]);
            setEditingProjects((currentProjects) => ({
                ...currentProjects,
                [createdProject.id]: editableProject(createdProject),
            }));
            setCreateErrors({});
            setNewProjectName('');
            setNewProjectDescription('');
            setStatusMessage(payload.message as string);
        } finally {
            setCreateProcessing(false);
        }
    };

    const handleProjectChange = (
        projectId: string,
        field: keyof EditableProject,
        value: string,
    ) => {
        setEditingProjects((currentProjects) => ({
            ...currentProjects,
            [projectId]: {
                ...(currentProjects[projectId] ?? {
                    name: '',
                    description: '',
                }),
                [field]: value,
            },
        }));
    };

    const handleUpdateProject = async (
        event: FormEvent<HTMLFormElement>,
        project: Project,
    ) => {
        event.preventDefault();

        setStatusMessage(null);
        setUpdatingProjectId(project.id);

        const editable =
            editingProjects[project.id] ?? editableProject(project);

        try {
            const response = await fetch(updateProject.url(project.id), {
                method: 'PATCH',
                headers: jsonHeaders(),
                body: JSON.stringify({
                    name: editable.name,
                    description: editable.description || null,
                }),
            });

            const payload = await response.json();

            if (response.status === 422) {
                setUpdateErrors((currentErrors) => ({
                    ...currentErrors,
                    [project.id]: mapValidationErrors(
                        payload.errors as ValidationErrors | undefined,
                    ),
                }));

                return;
            }

            if (!response.ok) {
                setUpdateErrors((currentErrors) => ({
                    ...currentErrors,
                    [project.id]: {
                        name: 'Unable to update the project right now.',
                    },
                }));

                return;
            }

            const updatedProject = payload.project as Project;

            setProjects((currentProjects) =>
                currentProjects.map((currentProject) =>
                    currentProject.id === updatedProject.id
                        ? updatedProject
                        : currentProject,
                ),
            );
            setUpdateErrors((currentErrors) => ({
                ...currentErrors,
                [project.id]: {},
            }));
            setStatusMessage(payload.message as string);
        } finally {
            setUpdatingProjectId(null);
        }
    };

    const handleArchiveProject = async (projectId: string) => {
        setStatusMessage(null);
        setArchivingProjectId(projectId);

        try {
            const response = await fetch(destroyProject.url(projectId), {
                method: 'DELETE',
                headers: jsonHeaders(),
            });

            const payload = await response.json();

            if (!response.ok) {
                setStatusMessage('Unable to archive the project right now.');

                return;
            }

            setProjects((currentProjects) =>
                currentProjects.filter((project) => project.id !== projectId),
            );
            setEditingProjects((currentProjects) => {
                const remainingProjects = { ...currentProjects };
                delete remainingProjects[projectId];

                return remainingProjects;
            });
            setUpdateErrors((currentErrors) => {
                const remainingErrors = { ...currentErrors };
                delete remainingErrors[projectId];

                return remainingErrors;
            });
            setStatusMessage(payload.message as string);
        } finally {
            setArchivingProjectId(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects" />

            <div className="space-y-6 p-4">
                <Heading
                    title="Projects"
                    description="Create, update, and archive the projects tied to your queue workloads."
                />

                {statusMessage !== null && (
                    <p className="text-sm font-medium text-green-600">
                        {statusMessage}
                    </p>
                )}

                <section className="space-y-4 rounded-xl border border-sidebar-border/70 p-4">
                    <Heading
                        variant="small"
                        title="Create project"
                        description="Each project can own its own API keys and usage history."
                    />

                    <form className="space-y-4" onSubmit={handleCreateProject}>
                        <div className="grid gap-2">
                            <Label htmlFor="project_name">Name</Label>
                            <Input
                                id="project_name"
                                name="name"
                                value={newProjectName}
                                onChange={(event) =>
                                    setNewProjectName(event.target.value)
                                }
                                placeholder="Production API"
                                required
                            />
                            <InputError message={createErrors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="project_description">
                                Description
                            </Label>
                            <textarea
                                id="project_description"
                                name="description"
                                rows={3}
                                value={newProjectDescription}
                                onChange={(event) =>
                                    setNewProjectDescription(event.target.value)
                                }
                                className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                placeholder="Internal event queue for background workers"
                            />
                            <InputError message={createErrors.description} />
                        </div>

                        <Button type="submit" disabled={createProcessing}>
                            {createProcessing
                                ? 'Creating...'
                                : 'Create project'}
                        </Button>
                    </form>
                </section>

                <section className="space-y-4">
                    <Heading
                        variant="small"
                        title="Your projects"
                        description="Manage active projects and archive what you no longer use."
                    />

                    {projects.length === 0 && (
                        <div className="rounded-xl border border-dashed border-sidebar-border/70 p-6 text-sm text-muted-foreground">
                            No projects yet.
                        </div>
                    )}

                    {projects.map((project) => {
                        const editable =
                            editingProjects[project.id] ??
                            editableProject(project);
                        const projectErrors = updateErrors[project.id] ?? {};

                        return (
                            <form
                                key={project.id}
                                onSubmit={(event) =>
                                    handleUpdateProject(event, project)
                                }
                                className="space-y-4 rounded-xl border border-sidebar-border/70 p-4"
                            >
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor={`project_name_${project.id}`}
                                    >
                                        Name
                                    </Label>
                                    <Input
                                        id={`project_name_${project.id}`}
                                        value={editable.name}
                                        onChange={(event) =>
                                            handleProjectChange(
                                                project.id,
                                                'name',
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError message={projectErrors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label
                                        htmlFor={`project_description_${project.id}`}
                                    >
                                        Description
                                    </Label>
                                    <textarea
                                        id={`project_description_${project.id}`}
                                        rows={3}
                                        value={editable.description}
                                        onChange={(event) =>
                                            handleProjectChange(
                                                project.id,
                                                'description',
                                                event.target.value,
                                            )
                                        }
                                        className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    />
                                    <InputError
                                        message={projectErrors.description}
                                    />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="submit"
                                        disabled={
                                            updatingProjectId === project.id
                                        }
                                    >
                                        {updatingProjectId === project.id
                                            ? 'Saving...'
                                            : 'Save changes'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        disabled={
                                            archivingProjectId === project.id
                                        }
                                        onClick={() =>
                                            handleArchiveProject(project.id)
                                        }
                                    >
                                        {archivingProjectId === project.id
                                            ? 'Archiving...'
                                            : 'Archive'}
                                    </Button>
                                </div>
                            </form>
                        );
                    })}
                </section>
            </div>
        </AppLayout>
    );
}
