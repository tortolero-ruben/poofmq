<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Display a listing of the user's projects.
     */
    public function index(Request $request): Response
    {
        $projects = Project::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('archived_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'created_at' => $project->created_at->toIso8601String(),
                'updated_at' => $project->updated_at->toIso8601String(),
            ]);

        return Inertia::render('projects/index', [
            'projects' => $projects,
        ]);
    }

    /**
     * Store a newly created project in storage.
     */
    public function store(StoreProjectRequest $request): JsonResponse
    {
        $this->authorize('create', Project::class);

        $project = Project::create([
            'user_id' => $request->user()->id,
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
        ]);

        return response()->json([
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'created_at' => $project->created_at->toIso8601String(),
                'updated_at' => $project->updated_at->toIso8601String(),
            ],
            'message' => 'Project created successfully.',
        ], 201);
    }

    /**
     * Update the specified project in storage.
     */
    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $project->update($request->validated());

        return response()->json([
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'archived_at' => $project->archived_at?->toIso8601String(),
                'created_at' => $project->created_at->toIso8601String(),
                'updated_at' => $project->updated_at->toIso8601String(),
            ],
            'message' => 'Project updated successfully.',
        ]);
    }

    /**
     * Archive the specified project.
     */
    public function destroy(Request $request, Project $project): JsonResponse|RedirectResponse
    {
        $this->authorize('delete', $project);

        $project->archive();

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Project archived successfully.',
            ]);
        }

        return back()->with('status', 'Project archived successfully.');
    }
}
